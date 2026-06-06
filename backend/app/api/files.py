from flask import Blueprint, send_file, abort
from app.storage import storage_service

files_bp = Blueprint("files", __name__)


@files_bp.get("/uploads/<path:relative_path>")
def serve_upload(relative_path):
    if not storage_service.file_exists(relative_path):
        abort(404)
    return send_file(storage_service.get_absolute_path(relative_path))
