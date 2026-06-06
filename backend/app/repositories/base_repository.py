from app import db


class BaseRepository:
    model = None

    def get_by_id(self, record_id):
        return self.model.query.filter_by(id=record_id, is_deleted=False).first()

    def get_all(self, page=1, per_page=20, **filters):
        q = self.model.query.filter_by(is_deleted=False, **filters)
        return q.order_by(self.model.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

    def get_all_unpaginated(self, **filters):
        return self.model.query.filter_by(is_deleted=False, **filters).all()

    def create(self, **kwargs):
        instance = self.model(**kwargs)
        db.session.add(instance)
        db.session.commit()
        return instance

    def update(self, record_id, **kwargs):
        instance = self.get_by_id(record_id)
        if not instance:
            return None
        for key, value in kwargs.items():
            setattr(instance, key, value)
        db.session.commit()
        return instance

    def soft_delete(self, record_id):
        instance = self.get_by_id(record_id)
        if not instance:
            return False
        instance.is_deleted = True
        db.session.commit()
        return True

    def hard_delete(self, record_id):
        instance = self.model.query.get(record_id)
        if not instance:
            return False
        db.session.delete(instance)
        db.session.commit()
        return True
