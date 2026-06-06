from flask import Blueprint, request, send_file
from app.services.media_service import MediaService
from app.utils.response import success, created, no_content, paginated
from app.storage import storage_service
from app.middleware.error_handlers import APIError

media_bp = Blueprint("media", __name__)
svc      = MediaService()


@media_bp.get("")
def list_media():
    media_type = request.args.get("type")
    page       = int(request.args.get("page", 1))
    per_page   = int(request.args.get("per_page", 20))
    result     = svc.get_all(media_type=media_type, page=page, per_page=per_page)
    return paginated([m.to_dict() for m in result.items], result)


@media_bp.post("")
def upload_media():
    if "file" not in request.files:
        raise APIError("No file provided", 400)
    file = request.files["file"]
    media = svc.upload(
        file_obj=file, original_filename=file.filename,
        media_type=request.form.get("media_type", "image"),
        caption=request.form.get("caption"),
        filter_name=request.form.get("filter_name"),
        overlay_data=request.form.get("overlay_data"),
        metadata_json=request.form.get("metadata_json"),
    )
    return created(media.to_dict(), "Media uploaded")


@media_bp.get("/<media_id>")
def get_media(media_id):
    return success(svc.get_one(media_id).to_dict())


@media_bp.patch("/<media_id>")
def update_media(media_id):
    data = request.get_json(force=True)
    return success(svc.update_caption(media_id, data.get("caption", "")).to_dict(), "Updated")


@media_bp.delete("/<media_id>")
def delete_media(media_id):
    svc.delete(media_id)
    return no_content()


@media_bp.get("/<media_id>/file")
def serve_file(media_id):
    media = svc.get_one(media_id)
    return send_file(storage_service.get_absolute_path(media.filepath))
