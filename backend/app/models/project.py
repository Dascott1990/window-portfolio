import uuid
import json
from app import db
from .base import BaseModel
 
 
class Project(BaseModel):
    __tablename__ = "projects"
 
    id          = db.Column(db.String(36), primary_key=True,
                            default=lambda: str(uuid.uuid4()))
    title       = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    tech_stack  = db.Column(db.Text, nullable=True)
    image_url   = db.Column(db.String(512), nullable=True)
    github_url  = db.Column(db.String(512), nullable=True)
    live_url    = db.Column(db.String(512), nullable=True)
    is_featured = db.Column(db.Boolean, nullable=False, default=False)
    sort_order  = db.Column(db.Integer, nullable=False, default=0)
    is_deleted  = db.Column(db.Boolean, nullable=False, default=False)
 
    def __repr__(self):
        return f"<Project {self.id} '{self.title}'>"
 
    def get_tech_stack(self):
        if self.tech_stack:
            try:
                return json.loads(self.tech_stack)
            except (json.JSONDecodeError, TypeError):
                return []
        return []
 
    def set_tech_stack(self, stack_list):
        self.tech_stack = json.dumps(stack_list) if stack_list else None
 
    def to_dict(self):
        d = super().to_dict()
        d["tech_stack"] = self.get_tech_stack()
        return d
