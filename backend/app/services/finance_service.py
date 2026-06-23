from decimal import Decimal
from datetime import date, timedelta
from app import db
from app.models import Wallet, Bill, Envelope, PaySchedule, NovaCard, Transaction
from app.middleware.error_handlers import APIError

FREQ_DAYS = {"weekly":7,"biweekly":14,"semimonthly":15,"monthly":30}

class FinanceService:

    def _wallet(self, currency="CAD"):
        w = Wallet.query.filter_by(currency=currency).first()
        if not w:
            w = Wallet(currency=currency, balance=Decimal("0"))
            db.session.add(w)
            db.session.commit()
        return w

    def list_schedules(self):
        return PaySchedule.query.filter_by(is_active=True).order_by(PaySchedule.next_pay_date).all()

    def create_schedule(self, label, amount, frequency, next_pay_date, currency="CAD"):
        s = PaySchedule(label=label, amount=Decimal(str(amount)),
                        frequency=frequency, next_pay_date=next_pay_date, currency=currency)
        db.session.add(s)
        db.session.commit()
        return s

    def delete_schedule(self, sid):
        s = PaySchedule.query.get(sid)
        if not s:
            raise APIError("Not found", 404)
        s.is_active = False
        db.session.commit()

    def list_bills(self):
        return Bill.query.filter_by(is_active=True).order_by(Bill.due_day).all()

    def create_bill(self, name, amount, due_day, category="other",
                    color="#ef4444", emoji="bill", autopay=False, currency="CAD"):
        b = Bill(name=name, amount=Decimal(str(amount)), due_day=int(due_day),
                 category=category, color=color, emoji=emoji,
                 autopay=autopay, currency=currency)
        db.session.add(b)
        db.session.commit()
        return b

    def delete_bill(self, bid):
        b = Bill.query.get(bid)
        if not b:
            raise APIError("Not found", 404)
        b.is_active = False
        db.session.commit()

    def list_envelopes(self):
        return Envelope.query.filter_by(is_active=True).order_by(Envelope.created_at).all()

    def create_envelope(self, name, target_total, per_cycle,
                        emoji="save", color="#a78bfa", currency="CAD"):
        e = Envelope(name=name, target_total=Decimal(str(target_total)),
                     per_cycle=Decimal(str(per_cycle)), emoji=emoji,
                     color=color, currency=currency)
        db.session.add(e)
        db.session.commit()
        return e

    def contribute_envelope(self, eid, amount):
        e = Envelope.query.get(eid)
        if not e:
            raise APIError("Not found", 404)
        e.saved = min(e.saved + Decimal(str(amount)), e.target_total)
        db.session.commit()
        return e

    def delete_envelope(self, eid):
        e = Envelope.query.get(eid)
        if not e:
            raise APIError("Not found", 404)
        e.is_active = False
        db.session.commit()

    def get_or_create_nova_card(self, currency="CAD"):
        c = NovaCard.query.filter_by(currency=currency).first()
        if not c:
            w = self._wallet(currency)
            c = NovaCard(wallet_id=w.id, currency=currency)
            db.session.add(c)
            db.session.commit()
        return c

    def freeze_card(self, cid):
        c = NovaCard.query.get(cid)
        if not c:
            raise APIError("Not found", 404)
        c.is_frozen = not c.is_frozen
        db.session.commit()
        return c

    def card_spend(self, cid, merchant, amount, currency="CAD"):
        c = NovaCard.query.get(cid)
        if not c:
            raise APIError("Not found", 404)
        if c.is_frozen:
            raise APIError("Card is frozen", 403)
        amount = Decimal(str(amount))
        s = self.compute_summary(currency)
        if amount > Decimal(str(s["free_balance"])):
            raise APIError("Insufficient free balance", 422)
        w = self._wallet(currency)
        w.balance -= amount
        c.spent_today += amount
        db.session.add(w)
        db.session.add(c)
        txn = Transaction(wallet_id=w.id, direction="debit",
                          merchant=merchant, amount=amount,
                          currency=currency, status="success", method="nova_card")
        db.session.add(txn)
        db.session.commit()
        return txn, c

    def compute_summary(self, currency="CAD"):
        w         = self._wallet(currency)
        balance   = float(w.balance or 0)
        bills     = self.list_bills()
        envelopes = self.list_envelopes()
        schedules = self.list_schedules()
        today     = date.today()

        next_pay = None
        next_amt = 0
        for s in schedules:
            if s.next_pay_date >= today:
                if next_pay is None or s.next_pay_date < next_pay:
                    next_pay = s.next_pay_date
                    next_amt = float(s.amount)

        bills_before = []
        if next_pay:
            for b in bills:
                try:
                    due = date(today.year, today.month, b.due_day)
                except ValueError:
                    due = date(today.year, today.month, 28)
                if due < today:
                    m = today.month + 1 if today.month < 12 else 1
                    y = today.year + (1 if today.month == 12 else 0)
                    try:
                        due = date(y, m, b.due_day)
                    except ValueError:
                        due = date(y, m, 28)
                if due <= next_pay:
                    bills_before.append({"name":b.name,"amount":float(b.amount),
                                         "due":due.isoformat(),"emoji":b.emoji})

        committed = sum(x["amount"] for x in bills_before)
        env_total = sum(float(e.per_cycle) for e in envelopes)
        free      = max(0, balance - committed - env_total)

        return {
            "wallet_balance":       round(balance, 2),
            "free_balance":         round(free, 2),
            "committed_before_pay": round(committed, 2),
            "envelope_per_cycle":   round(env_total, 2),
            "bills_before_pay":     bills_before,
            "next_pay_date":        next_pay.isoformat() if next_pay else None,
            "next_pay_amount":      next_amt,
            "days_to_pay":          (next_pay - today).days if next_pay else None,
            "currency":             currency,
        }

    def compute_timeline(self, currency="CAD"):
        schedules = self.list_schedules()
        bills     = self.list_bills()
        w         = self._wallet(currency)
        today     = date.today()
        end       = today + timedelta(weeks=6)
        running   = float(w.balance or 0)
        events    = []
        cur       = today
        while cur <= end:
            day = []
            for s in schedules:
                pay = s.next_pay_date
                fd  = FREQ_DAYS.get(s.frequency, 14)
                while pay <= end:
                    if pay == cur:
                        day.append({"type":"income","label":s.label,
                                    "amount":float(s.amount),"emoji":"pay","color":"#4ade80"})
                        running += float(s.amount)
                        break
                    pay += timedelta(days=fd)
            for b in bills:
                try:
                    due = date(cur.year, cur.month, b.due_day)
                except ValueError:
                    due = date(cur.year, cur.month, 28)
                if due == cur:
                    day.append({"type":"bill","label":b.name,
                                "amount":float(b.amount),"emoji":b.emoji,"color":b.color})
                    running -= float(b.amount)
            if day:
                events.append({"date":cur.isoformat(),"events":day,
                               "balance":round(max(0,running),2)})
            cur += timedelta(days=1)
        return events
