"""
app/services/camera_service.py — UPDATED

All media content is now stored as binary in the `media.file_data` and
`media.thumb_data` columns.  No files are written to the local filesystem.
The `storage_service` is no longer called for photos or videos captured
through the camera — eliminating the disk-dependency entirely.
"""

import base64
import io
import uuid
from datetime import datetime, timezone

from flask import current_app
from PIL import Image as PILImage

from app.repositories import MediaRepository
from app.middleware.error_handlers import APIError


class CameraService:

    def __init__(self):
        self.repo = MediaRepository()

    # ── Base64 decode ─────────────────────────────────────────────────────────
    def _decode_base64_image(self, data_url: str):
        if data_url.startswith("data:"):
            header, b64 = data_url.split(",", 1)
            mime = header.split(":")[1].split(";")[0]
            ext  = mime.split("/")[1].replace("jpeg", "jpg")
        else:
            b64  = data_url
            ext  = "jpg"
        raw = base64.b64decode(b64)
        return raw, ext

    # ── Save PIL image to bytes (in-memory, no disk) ──────────────────────────
    def _encode_image(self, img: PILImage.Image, ext: str) -> dict:
        """Return dict with file_bytes, thumb_bytes, width, height, file_size."""
        # Full-size
        buf = io.BytesIO()
        fmt = "JPEG" if ext in ("jpg", "jpeg") else ext.upper()
        img.save(buf, format=fmt, quality=92)
        file_bytes = buf.getvalue()

        # Thumbnail
        thumb = img.copy()
        thumb.thumbnail((400, 400))
        tbuf = io.BytesIO()
        thumb.convert("RGB").save(tbuf, format="JPEG", quality=80)
        thumb_bytes = tbuf.getvalue()

        return {
            "file_bytes":  file_bytes,
            "thumb_bytes": thumb_bytes,
            "width":       img.width,
            "height":      img.height,
            "file_size":   len(file_bytes),
        }

    # ── Upload a base64-encoded photo ─────────────────────────────────────────
    def upload_base64(self, data_url: str, mode: str = "photo",
                      caption: str = None, filter_name: str = None,
                      overlay_data: dict = None, metadata_json: dict = None):
        if not data_url:
            raise APIError("data_url is required", 400)
        try:
            raw, ext = self._decode_base64_image(data_url)
            img = PILImage.open(io.BytesIO(raw)).convert("RGB")
        except Exception as exc:
            current_app.logger.error(f"base64 decode failed: {exc}")
            raise APIError("Invalid image data", 400)

        stored = self._encode_image(img, ext)
        filename = f"{uuid.uuid4().hex}.{ext}"

        return self.repo.create(
            filename=filename,
            filepath=None,             # no longer written to disk
            thumbnail=None,
            file_data=stored["file_bytes"],
            thumb_data=stored["thumb_bytes"],
            media_type="image",
            mime_type=f"image/{ext}",
            file_size=stored["file_size"],
            width=stored["width"],
            height=stored["height"],
            caption=caption,
            filter_name=filter_name or mode,
            overlay_data=overlay_data,
            metadata_json={
                **(metadata_json or {}),
                "camera_mode": mode,
                "captured_at": datetime.now(timezone.utc).isoformat(),
            },
        )

    # ── Upload a video file (stored as binary in DB) ──────────────────────────
    def upload_video(self, file_obj, original_filename: str,
                     mode: str = "video", metadata_json: dict = None):
        video_bytes = file_obj.read()
        filename    = f"{uuid.uuid4().hex}.webm"

        return self.repo.create(
            filename=filename,
            filepath=None,
            thumbnail=None,
            file_data=video_bytes,
            thumb_data=None,
            media_type="video",
            mime_type="video/webm",
            file_size=len(video_bytes),
            filter_name=mode,
            metadata_json={
                **(metadata_json or {}),
                "camera_mode": mode,
                "captured_at": datetime.now(timezone.utc).isoformat(),
            },
        )

    # ── Edit caption / filter ─────────────────────────────────────────────────
    def save_edit(self, media_id: str, caption: str = None,
                  filter_name: str = None, overlay_data: dict = None):
        item = self.repo.get_by_id(media_id)
        if not item:
            raise APIError("Media not found", 404)
        updates = {}
        if caption      is not None: updates["caption"]      = caption
        if filter_name  is not None: updates["filter_name"]  = filter_name
        if overlay_data is not None: updates["overlay_data"] = overlay_data
        if not updates:
            return item
        return self.repo.update(media_id, **updates)

    # ── Gallery ───────────────────────────────────────────────────────────────
    def get_gallery(self, album: str = "all", page: int = 1, per_page: int = 30):
        if album == "video":
            return self.repo.get_by_type("video", page=page, per_page=per_page)
        if album and album != "all":
            from app.models import Media
            return (
                Media.query
                .filter_by(is_deleted=False, media_type="image", filter_name=album)
                .order_by(Media.created_at.desc())
                .paginate(page=page, per_page=per_page, error_out=False)
            )
        return self.repo.get_all(page=page, per_page=per_page)

    def get_item(self, media_id: str):
        item = self.repo.get_by_id(media_id)
        if not item:
            raise APIError("Media not found", 404)
        return item

    def delete_item(self, media_id: str):
        # No filesystem cleanup needed — data lives in DB
        return self.repo.soft_delete(media_id)

    def get_recent(self, limit: int = 10):
        return self.repo.get_recent(limit=limit)