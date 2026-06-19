from flask import Blueprint, request
from app.repositories import TransactionRepository
from app.utils.response import success, paginated

transactions_bp = Blueprint("transactions", __name__)
repo = TransactionRepository()


@transactions_bp.get("")
def list_transactions():
    result = repo.get_all(
        page=int(request.args.get("page", 1)),
        per_page=int(request.args.get("per_page", 20)),
    )
    return paginated([t.to_dict() for t in result.items], result)


@transactions_bp.get("/summary")
def summary():
    currency = request.args.get("currency", "CAD")
    return success({"total": repo.get_total(currency=currency), "currency": currency})
