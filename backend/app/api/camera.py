"""
app/api/camera.py — UPDATED

File serving now reads `file_data` / `thumb_data` from the database row
instead of reading from the local filesystem.  Everything else is unchanged.
"""
from flask import Blueprint, request, Response
from app.services.camera_service import CameraService
from app.utils.response import success, created, no_content, paginated
from app.middleware.error_handlers import APIError

camera_bp = Blueprint("camera", __name__)
svc       = CameraService()


def _serialize(item) -> dict:
    d = item.to_dict()
    # Remove raw binary blobs — never send them as JSON
    d.pop("file_data",  None)
    d.pop("thumb_data", None)
    # Permanent URLs: served from the database via the endpoints below
    d["file_url"]      = f"/api/v1/camera/{item.id}/file"
    d["thumbnail_url"] = f"/api/v1/camera/{item.id}/thumbnail" if item.thumb_data else None
    return d


@camera_bp.post("/photo")
def upload_photo():
    data = request.get_json(force=True)
    if not data.get("data_url"):
        raise APIError("data_url is required", 400)
    item = svc.upload_base64(
        data_url=data["data_url"],
        mode=data.get("mode", "photo"),
        caption=data.get("caption"),
        filter_name=data.get("filter_name"),
        overlay_data=data.get("overlay_data"),
        metadata_json=data.get("metadata_json"),
    )
    return created(_serialize(item), "Photo saved")


@camera_bp.post("/video")
def upload_video():
    if "file" not in request.files:
        raise APIError("No video file provided", 400)
    file = request.files["file"]
    item = svc.upload_video(
        file_obj=file,
        original_filename=file.filename or "recording.webm",
        mode=request.form.get("mode", "video"),
        metadata_json={"duration": request.form.get("duration")},
    )
    return created(_serialize(item), "Video saved")


@camera_bp.get("/gallery")
def gallery():
    album    = request.args.get("album", "all")
    page     = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 30))
    result   = svc.get_gallery(album=album, page=page, per_page=per_page)
    return paginated([_serialize(m) for m in result.items], result, "Gallery")


@camera_bp.get("/gallery/recent")
def recent():
    limit = int(request.args.get("limit", 10))
    return success([_serialize(m) for m in svc.get_recent(limit=limit)], "Recent media")


@camera_bp.get("/<media_id>")
def get_item(media_id):
    return success(_serialize(svc.get_item(media_id)))


@camera_bp.patch("/<media_id>")
def save_edit(media_id):
    data = request.get_json(force=True)
    item = svc.save_edit(
        media_id=media_id,
        caption=data.get("caption"),
        filter_name=data.get("filter_name"),
        overlay_data=data.get("overlay_data"),
    )
    return success(_serialize(item), "Saved")


@camera_bp.delete("/<media_id>")
def delete_item(media_id):
    svc.delete_item(media_id)
    return no_content()


@camera_bp.get("/<media_id>/file")
def serve_file(media_id):
    """Stream the binary content stored in the database."""
    item = svc.get_item(media_id)
    if not item.file_data:
        raise APIError("No file data available", 404)
    mime = item.mime_type or "application/octet-stream"
    return Response(
        item.file_data,
        mimetype=mime,
        headers={
            "Content-Disposition": f'inline; filename="{item.filename}"',
            "Cache-Control": "public, max-age=31536000, immutable",
        },
    )


@camera_bp.get("/<media_id>/thumbnail")
def serve_thumbnail(media_id):
    """Stream the thumbnail binary stored in the database."""
    item = svc.get_item(media_id)
    if not item.thumb_data:
        raise APIError("No thumbnail available", 404)
    return Response(
        item.thumb_data,
        mimetype="image/jpeg",
        headers={
            "Content-Disposition": f'inline; filename="thumb_{item.filename}"',
            "Cache-Control": "public, max-age=31536000, immutable",
        },
    )