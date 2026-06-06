from flask import Blueprint, request
from app.repositories import ProjectRepository
from app.utils.response import success, created, no_content, paginated
from app.middleware.error_handlers import APIError

projects_bp = Blueprint("projects", __name__)
repo        = ProjectRepository()

ALLOWED = ("title", "description", "tech_stack", "image_url", "github_url", "live_url", "is_featured", "sort_order")


@projects_bp.get("")
def list_projects():
    if request.args.get("featured", "false").lower() == "true":
        return success([p.to_dict() for p in repo.get_featured()])
    result = repo.get_all(page=int(request.args.get("page", 1)), per_page=int(request.args.get("per_page", 20)))
    return paginated([p.to_dict() for p in result.items], result)


@projects_bp.post("")
def create_project():
    data = request.get_json(force=True)
    if not data.get("title"):
        raise APIError("title is required", 400)
    return created(repo.create(**{k: v for k, v in data.items() if k in ALLOWED}).to_dict(), "Project created")


@projects_bp.get("/<project_id>")
def get_project(project_id):
    p = repo.get_by_id(project_id)
    if not p:
        raise APIError("Project not found", 404)
    return success(p.to_dict())


@projects_bp.patch("/<project_id>")
def update_project(project_id):
    data = request.get_json(force=True)
    p = repo.update(project_id, **{k: v for k, v in data.items() if k in ALLOWED})
    if not p:
        raise APIError("Project not found", 404)
    return success(p.to_dict(), "Updated")


@projects_bp.delete("/<project_id>")
def delete_project(project_id):
    if not repo.soft_delete(project_id):
        raise APIError("Project not found", 404)
    return no_content()
