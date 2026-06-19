from flask import Blueprint, request
from app.services.wallet_service import WalletService
from app.utils.response import success, created
from app.middleware.error_handlers import APIError

wallet_bp = Blueprint("wallet", __name__)
svc = WalletService()


@wallet_bp.get("")
def get_wallet():
    currency = request.args.get("currency", "CAD")
    wallet = svc.get_or_create_wallet(currency)
    data = wallet.to_dict()
    data.update(svc.get_summary(wallet))
    return success(data)


@wallet_bp.post("/top-up")
def top_up():
    data = request.get_json(force=True)
    if data.get("amount") is None:
        raise APIError("amount is required", 400)
    wallet, txn = svc.top_up(
        amount=data["amount"],
        currency=data.get("currency", "CAD"),
        method=data.get("method", "manual"),
        reference=data.get("reference"),
    )
    return created({"wallet": wallet.to_dict(), "transaction": txn.to_dict()}, "Wallet topped up")


@wallet_bp.post("/send")
def send_payment():
    data = request.get_json(force=True)
    if not data.get("merchant") or data.get("amount") is None:
        raise APIError("merchant and amount are required", 400)
    txn, ok = svc.send_payment(
        merchant=data["merchant"],
        amount=data["amount"],
        currency=data.get("currency", "CAD"),
        method=data.get("method", "wallet"),
        card_id=data.get("card_id"),
        notes=data.get("notes"),
    )
    payload = txn.to_dict()
    if ok:
        return created(payload, "Payment sent")
    return success(payload, "Payment declined")


@wallet_bp.post("/request")
def request_payment():
    data = request.get_json(force=True)
    if not data.get("from") or data.get("amount") is None:
        raise APIError("from and amount are required", 400)
    txn = svc.request_payment(
        from_party=data["from"],
        amount=data["amount"],
        currency=data.get("currency", "CAD"),
        notes=data.get("notes"),
    )
    return created(txn.to_dict(), "Request recorded")


@wallet_bp.get("/cards")
def list_cards():
    currency = request.args.get("currency", "CAD")
    wallet = svc.get_or_create_wallet(currency)
    return success([c.to_dict() for c in svc.list_cards(wallet)])


@wallet_bp.post("/cards")
def create_card():
    data = request.get_json(force=True)
    missing = [f for f in ("label", "last4", "expiry_month", "expiry_year", "credit_limit") if data.get(f) is None]
    if missing:
        raise APIError(f"Missing: {', '.join(missing)}", 400)
    wallet = svc.get_or_create_wallet(data.get("currency", "CAD"))
    card = svc.create_card(
        wallet=wallet,
        label=data["label"],
        last4=str(data["last4"]),
        network=data.get("network", "nova"),
        expiry_month=int(data["expiry_month"]),
        expiry_year=int(data["expiry_year"]),
        credit_limit=data["credit_limit"],
        is_primary=bool(data.get("is_primary", False)),
    )
    return created(card.to_dict(), "Card added")
