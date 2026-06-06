from flask import Blueprint, request
from app.repositories import ContactRepository
from app.utils.response import success, created, no_content, paginated
from app.middleware.error_handlers import APIError

contacts_bp = Blueprint("contacts", __name__)
repo        = ContactRepository()

ALLOWED = ("name", "phone", "email", "notes", "is_favorite", "avatar_url")


@contacts_bp.get("")
def list_contacts():
    q = request.args.get("q")
    page, per_page = int(request.args.get("page", 1)), int(request.args.get("per_page", 50))
    result = repo.search(q, page=page, per_page=per_page) if q else repo.get_all(page=page, per_page=per_page)
    return paginated([c.to_dict() for c in result.items], result)


@contacts_bp.get("/favorites")
def favorites():
    return success([c.to_dict() for c in repo.get_favorites()])


@contacts_bp.post("")
def create_contact():
    data = request.get_json(force=True)
    if not data.get("name"):
        raise APIError("name is required", 400)
    return created(repo.create(**{k: v for k, v in data.items() if k in ALLOWED}).to_dict(), "Contact created")


@contacts_bp.get("/<contact_id>")
def get_contact(contact_id):
    c = repo.get_by_id(contact_id)
    if not c:
        raise APIError("Contact not found", 404)
    return success(c.to_dict())


@contacts_bp.patch("/<contact_id>")
def update_contact(contact_id):
    data = request.get_json(force=True)
    c = repo.update(contact_id, **{k: v for k, v in data.items() if k in ALLOWED})
    if not c:
        raise APIError("Contact not found", 404)
    return success(c.to_dict(), "Updated")


@contacts_bp.delete("/<contact_id>")
def delete_contact(contact_id):
    if not repo.soft_delete(contact_id):
        raise APIError("Contact not found", 404)
    return no_content()
