from app.models import Transaction
from .base_repository import BaseRepository


class TransactionRepository(BaseRepository):
    model = Transaction

    def get_all(self, page=1, per_page=20, **filters):
        return (
            Transaction.query
            .filter_by(**filters)
            .order_by(Transaction.created_at.desc())
            .paginate(page=page, per_page=per_page, error_out=False)
        )

    def get_by_id(self, record_id):
        return Transaction.query.filter_by(id=record_id).first()

    def get_by_status(self, status, page=1, per_page=20):
        return (
            Transaction.query
            .filter_by(status=status)
            .order_by(Transaction.created_at.desc())
            .paginate(page=page, per_page=per_page, error_out=False)
        )

    def get_total(self, currency="CAD"):
        from sqlalchemy import func
        result = (
            Transaction.query
            .with_entities(func.sum(Transaction.amount))
            .filter_by(status="success", currency=currency, direction="debit")
            .scalar()
        )
        return float(result or 0)
