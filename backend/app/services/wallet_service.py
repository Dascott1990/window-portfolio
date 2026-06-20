from decimal import Decimal
from flask import current_app
from app import db
from app.models import Wallet, Card, Transaction
from app.middleware.error_handlers import APIError


class WalletService:

    def _mailer(self):
        from app.email import email_service
        return email_service

    def get_or_create_wallet(self, currency="CAD"):
        wallet = Wallet.query.filter_by(currency=currency).first()
        if wallet:
            return wallet
        wallet = Wallet(currency=currency, balance=Decimal("0"))
        db.session.add(wallet)
        db.session.commit()
        return wallet

    def top_up(self, amount, currency="CAD", method="manual",
               reference=None, notify_email=None):
        amount = Decimal(str(amount))
        if amount <= 0:
            raise APIError("Top-up amount must be positive", 400)
        wallet = self.get_or_create_wallet(currency)
        wallet.balance = wallet.balance + amount
        db.session.add(wallet)
        txn = Transaction(
            wallet_id=wallet.id, direction="credit", merchant="Wallet Top-up",
            amount=amount, currency=currency, status="success",
            method=method, reference=reference,
        )
        db.session.add(txn)
        db.session.commit()
        if notify_email:
            try:
                self._mailer().send_top_up_confirmation(notify_email, txn)
            except Exception as e:
                current_app.logger.error(f"Top-up email failed: {e}")
        return wallet, txn

    def send_payment(self, merchant, amount, currency="CAD",
                     method="wallet", card_id=None, notes=None,
                     sender_email=None, recipient_email=None):
        amount = Decimal(str(amount))
        if amount <= 0:
            raise APIError("Amount must be positive", 400)
        if not merchant or not merchant.strip():
            raise APIError("Merchant is required", 400)

        wallet = self.get_or_create_wallet(currency)
        card = None
        if card_id:
            card = Card.query.filter_by(id=card_id, is_active=True).first()
            if not card:
                raise APIError("Card not found or inactive", 404)

        # Real funds check — no randomness
        if card:
            available = card.credit_limit - card.spent
            if amount > available:
                txn = Transaction(
                    wallet_id=wallet.id, card_id=card.id, direction="debit",
                    merchant=merchant.strip(), amount=amount, currency=currency,
                    status="failed", decline_reason="insufficient_credit",
                    method=method, notes=notes,
                )
                db.session.add(txn)
                db.session.commit()
                if sender_email:
                    try:
                        self._mailer().send_payment_declined(sender_email, txn)
                    except Exception as e:
                        current_app.logger.error(f"Decline email failed: {e}")
                return txn, False
        else:
            if amount > wallet.balance:
                txn = Transaction(
                    wallet_id=wallet.id, direction="debit",
                    merchant=merchant.strip(), amount=amount, currency=currency,
                    status="failed", decline_reason="insufficient_funds",
                    method=method, notes=notes,
                )
                db.session.add(txn)
                db.session.commit()
                if sender_email:
                    try:
                        self._mailer().send_payment_declined(sender_email, txn)
                    except Exception as e:
                        current_app.logger.error(f"Decline email failed: {e}")
                return txn, False

        # Debit atomically
        if card:
            card.spent = card.spent + amount
            db.session.add(card)
        else:
            wallet.balance = wallet.balance - amount
            db.session.add(wallet)

        txn = Transaction(
            wallet_id=wallet.id, card_id=card.id if card else None,
            direction="debit", merchant=merchant.strip(),
            amount=amount, currency=currency, status="success",
            method=method, notes=notes,
        )
        db.session.add(txn)
        db.session.commit()

        # Send confirmation to sender + receipt to recipient
        mailer = self._mailer()
        if sender_email:
            try:
                mailer.send_payment_confirmation(sender_email, txn)
            except Exception as e:
                current_app.logger.error(f"Sender confirm email failed: {e}")
        if recipient_email:
            try:
                mailer.send_payment_sent(recipient_email, txn)
            except Exception as e:
                current_app.logger.error(f"Recipient notify email failed: {e}")

        return txn, True

    def request_payment(self, from_party, amount, currency="CAD",
                        notes=None, requester_email=None, notify_email=None):
        amount = Decimal(str(amount))
        if amount <= 0:
            raise APIError("Amount must be positive", 400)
        if not from_party or not from_party.strip():
            raise APIError("from_party is required", 400)

        wallet = self.get_or_create_wallet(currency)
        txn = Transaction(
            wallet_id=wallet.id, direction="credit",
            merchant=from_party.strip(), amount=amount,
            currency=currency, status="pending",
            method="request", notes=notes,
        )
        db.session.add(txn)
        db.session.commit()

        # Email the person being requested
        if notify_email:
            try:
                self._mailer().send_payment_request(
                    notify_email, txn,
                    requester_name=requester_email or "NovaPay User"
                )
            except Exception as e:
                current_app.logger.error(f"Request email failed: {e}")

        return txn

    def list_cards(self, wallet):
        return Card.query.filter_by(
            wallet_id=wallet.id, is_active=True
        ).order_by(Card.is_primary.desc(), Card.created_at).all()

    def create_card(self, wallet, label, last4, network,
                    expiry_month, expiry_year, credit_limit, is_primary=False):
        if len(last4) != 4 or not last4.isdigit():
            raise APIError("last4 must be exactly 4 digits", 400)
        if is_primary:
            Card.query.filter_by(wallet_id=wallet.id).update({"is_primary": False})
        card = Card(
            wallet_id=wallet.id, label=label, last4=last4,
            network=network, expiry_month=expiry_month,
            expiry_year=expiry_year,
            credit_limit=Decimal(str(credit_limit)),
            spent=Decimal("0"), is_primary=is_primary,
        )
        db.session.add(card)
        db.session.commit()
        return card

    def get_summary(self, wallet):
        from sqlalchemy import func
        total_spent = (
            db.session.query(func.coalesce(func.sum(Transaction.amount), 0))
            .filter(
                Transaction.wallet_id == wallet.id,
                Transaction.status == "success",
                Transaction.direction == "debit",
            )
            .scalar()
        )
        total_count = Transaction.query.filter(
            Transaction.wallet_id == wallet.id
        ).count()
        return {
            "total_spent": float(total_spent or 0),
            "transaction_count": total_count,
        }