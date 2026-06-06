from flask import Blueprint, request
from app.repositories import TransactionRepository
from app.utils.response import success, created, paginated
from app.middleware.error_handlers import APIError

transactions_bp = Blueprint("transactions", __name__)
repo            = TransactionRepository()

ALLOWED = ("merchant", "amount", "currency", "status", "method", "reference", "notes")


@transactions_bp.get("")
def list_transactions():
    result = repo.get_all(page=int(request.args.get("page", 1)), per_page=int(request.args.get("per_page", 20)))
    return paginated([t.to_dict() for t in result.items], result)


@transactions_bp.post("")
def create_transaction():
    data = request.get_json(force=True)
    if not data.get("merchant") or not data.get("amount"):
        raise APIError("merchant and amount are required", 400)
    return created(repo.create(**{k: v for k, v in data.items() if k in ALLOWED}).to_dict(), "Transaction recorded")


@transactions_bp.get("/summary")
def summary():
    currency = request.args.get("currency", "CAD")
    return success({"total": repo.get_total(currency=currency), "currency": currency})
