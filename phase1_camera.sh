cat << 'SCRIPT' > /mnt/user-data/outputs/phase1_camera.sh
#!/bin/bash
# PHASE 1 — Camera
# Run from your Project root: bash phase1_camera.sh

set -e
echo "=== PHASE 1: Camera Backend ==="

# ─── 1. Upgrade migration for Camera-specific indexes ─────────────────────────
cat > backend/migrations/versions/001_camera_indexes.py << 'EOF'
"""camera indexes

Revision ID: 001_camera_indexes
Revises: 
Create Date: 2026-06-03
"""
from alembic import op
import sqlalchemy as sa

revision = '001_camera_indexes'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # These indexes speed up the gallery queries Camera.js performs:
    # - list by media_type (photo / video tabs)
    # - order by created_at DESC (most recent first)
    # - filter is_deleted = false
    op.create_index('ix_media_type_deleted_created',
                    'media', ['media_type', 'is_deleted', 'created_at'])
    op.create_index('ix_media_deleted_created',
                    'media', ['is_deleted', 'created_at'])


def downgrade():
    op.drop_index('ix_media_type_deleted_created', table_name='media')
    op.drop_index('ix_media_deleted_created',      table_name='media')
EOF
echo "✅ migrations/versions/001_camera_indexes.py"

# ─── 2. Camera service — handles base64 AND multipart uploads ─────────────────
cat > backend/app/services/camera_service.py << 'EOF'
"""
CameraService
─────────────
Handles every operation the Camera frontend needs:

  upload_base64()   — receives the canvas data-URL the browser sends after
                      a photo capture (Camera.js line ~450: canvas.toDataURL)
  upload_file()     — receives a video Blob via FormData
  save_edit()       — persists caption / filter / overlay changes
  get_gallery()     — returns paginated list for the gallery sheet
  get_item()        — single item (for the preview screen)
  delete_item()     — soft-delete + remove files from disk
"""

import base64
import io
import uuid
from datetime import datetime, timezone

from flask import current_app
from PIL import Image as PILImage

from app.repositories import MediaRepository
from app.storage import storage_service
from app.middleware.error_handlers import APIError


class CameraService:

    def __init__(self):
        self.repo    = MediaRepository()
        self.storage = storage_service

    # ── helpers ───────────────────────────────────────────────────────────────

    def _decode_base64_image(self, data_url: str):
        """
        Strip the data-URL header and decode to raw bytes.
        Accepts:  data:image/jpeg;base64,/9j/4AAQ...
                  /9j/4AAQ...   (bare base64, no header)
        Returns: (bytes, ext)
        """
        if data_url.startswith("data:"):
            header, b64 = data_url.split(",", 1)
            mime = header.split(":")[1].split(";")[0]   # image/jpeg
            ext  = mime.split("/")[1]                   # jpeg
        else:
            b64  = data_url
            ext  = "jpg"

        raw = base64.b64decode(b64)
        return raw, ext

    def _save_pil_image(self, img: PILImage.Image, ext: str) -> dict:
        """
        Write a PIL image to the uploads folder and generate a thumbnail.
        Returns the dict that MediaRepository.create() expects.
        """
        from pathlib import Path

        filename  = f"{uuid.uuid4().hex}.{ext}"
        today     = datetime.utcnow().strftime("%Y/%m/%d")
        rel_dir   = f"images/{today}"
        thumb_dir = f"thumbnails/{today}"

        upload_root = self.storage._upload_root()
        abs_dir   = upload_root / rel_dir
        abs_thumb = upload_root / thumb_dir
        abs_dir.mkdir(parents=True, exist_ok=True)
        abs_thumb.mkdir(parents=True, exist_ok=True)

        filepath = abs_dir / filename
        img.save(str(filepath), quality=92)
        width, height = img.size
        file_size     = filepath.stat().st_size

        # Thumbnail
        thumb_img  = img.copy()
        thumb_img.thumbnail((400, 400))
        thumb_name = f"thumb_{filename.replace('.' + ext, '.jpg')}"
        thumb_path = abs_thumb / thumb_name
        thumb_img.convert("RGB").save(str(thumb_path), "JPEG", quality=80)

        return {
            "filename":  filename,
            "filepath":  f"{rel_dir}/{filename}",
            "thumbnail": f"{thumb_dir}/{thumb_name}",
            "width":     width,
            "height":    height,
            "file_size": file_size,
        }

    # ── public API ────────────────────────────────────────────────────────────

    def upload_base64(
        self, data_url: str, mode: str = "photo",
        caption: str = None, filter_name: str = None,
        overlay_data: dict = None, metadata_json: dict = None,
    ):
        """
        Called when the browser sends a canvas data-URL after taking a photo.
        Camera.js captures to canvas then calls toDataURL('image/jpeg', 0.92).
        """
        if not data_url:
            raise APIError("data_url is required", 400)

        try:
            raw, ext = self._decode_base64_image(data_url)
            img = PILImage.open(io.BytesIO(raw)).convert("RGB")
        except Exception as exc:
            current_app.logger.error(f"base64 decode failed: {exc}")
            raise APIError("Invalid image data", 400)

        stored = self._save_pil_image(img, ext if ext != "jpeg" else "jpg")

        return self.repo.create(
            filename=stored["filename"],
            filepath=stored["filepath"],
            thumbnail=stored["thumbnail"],
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

    def upload_video(self, file_obj, original_filename: str, mode: str = "video",
                     metadata_json: dict = None):
        """Receives a video Blob from MediaRecorder via FormData."""
        if not self.storage.is_allowed_video(original_filename):
            raise APIError("Video format not allowed", 400)

        stored = self.storage.save_video(file_obj, original_filename)

        return self.repo.create(
            filename=stored["filename"],
            filepath=stored["filepath"],
            thumbnail=None,
            media_type="video",
            mime_type="video/webm",
            file_size=stored["file_size"],
            filter_name=mode,
            metadata_json={
                **(metadata_json or {}),
                "camera_mode": mode,
                "captured_at": datetime.now(timezone.utc).isoformat(),
            },
        )

    def save_edit(self, media_id: str, caption: str = None,
                  filter_name: str = None, overlay_data: dict = None):
        """
        Persists edits the user makes in the gallery preview:
        - caption text
        - filter applied
        - overlay / sticker data
        """
        item = self.repo.get_by_id(media_id)
        if not item:
            raise APIError("Media not found", 404)

        updates = {}
        if caption     is not None: updates["caption"]      = caption
        if filter_name is not None: updates["filter_name"]  = filter_name
        if overlay_data is not None: updates["overlay_data"] = overlay_data

        if not updates:
            return item

        return self.repo.update(media_id, **updates)

    def get_gallery(self, media_type: str = None,
                    album: str = "all", page: int = 1, per_page: int = 30):
        """
        Returns paginated gallery matching Camera.js album tabs:
          all   — everything
          video — only videos
          <mode_id> — photos taken in that mode (filter_name = mode)
        """
        if album == "video" or media_type == "video":
            return self.repo.get_by_type("video", page=page, per_page=per_page)

        if album and album != "all":
            # Album = camera mode (portrait, night, ai, etc.)
            from app.models import Media
            from app import db
            q = (
                Media.query
                .filter_by(is_deleted=False, media_type="image", filter_name=album)
                .order_by(Media.created_at.desc())
                .paginate(page=page, per_page=per_page, error_out=False)
            )
            return q

        if media_type == "image":
            return self.repo.get_by_type("image", page=page, per_page=per_page)

        return self.repo.get_all(page=page, per_page=per_page)

    def get_item(self, media_id: str):
        item = self.repo.get_by_id(media_id)
        if not item:
            raise APIError("Media not found", 404)
        return item

    def delete_item(self, media_id: str):
        item = self.get_item(media_id)
        self.storage.delete_file(item.filepath)
        if item.thumbnail:
            self.storage.delete_file(item.thumbnail)
        return self.repo.soft_delete(media_id)

    def get_recent(self, limit: int = 10):
        return self.repo.get_recent(limit=limit)
EOF
echo "✅ app/services/camera_service.py"

# ─── 3. Camera API blueprint ──────────────────────────────────────────────────
cat > backend/app/api/camera.py << 'EOF'
"""
Camera API Blueprint
────────────────────
All routes the Camera.js frontend talks to.

POST   /api/v1/camera/photo          Upload base64 photo
POST   /api/v1/camera/video          Upload video blob
GET    /api/v1/camera/gallery        Gallery list (paginated)
GET    /api/v1/camera/gallery/recent 10 most-recent items
GET    /api/v1/camera/:id            Single item
PATCH  /api/v1/camera/:id            Save edits (caption / filter / overlay)
DELETE /api/v1/camera/:id            Delete item
GET    /api/v1/camera/:id/file       Serve the raw file
GET    /api/v1/camera/:id/thumbnail  Serve the thumbnail
"""

from flask import Blueprint, request, send_file
from app.services.camera_service import CameraService
from app.utils.response import success, created, no_content, paginated
from app.middleware.error_handlers import APIError
from app.storage import storage_service

camera_bp = Blueprint("camera", __name__)
svc       = CameraService()


# ── Upload photo (base64 data-URL from canvas) ────────────────────────────────
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


# ── Upload video (blob via FormData) ──────────────────────────────────────────
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


# ── Gallery list ──────────────────────────────────────────────────────────────
@camera_bp.get("/gallery")
def gallery():
    album    = request.args.get("album", "all")
    page     = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 30))
    result   = svc.get_gallery(album=album, page=page, per_page=per_page)
    return paginated([_serialize(m) for m in result.items], result, "Gallery")


# ── Recent items (for quick-access strip) ─────────────────────────────────────
@camera_bp.get("/gallery/recent")
def recent():
    limit = int(request.args.get("limit", 10))
    items = svc.get_recent(limit=limit)
    return success([_serialize(m) for m in items], "Recent media")


# ── Single item ───────────────────────────────────────────────────────────────
@camera_bp.get("/<media_id>")
def get_item(media_id):
    return success(_serialize(svc.get_item(media_id)))


# ── Save edits ────────────────────────────────────────────────────────────────
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


# ── Delete ────────────────────────────────────────────────────────────────────
@camera_bp.delete("/<media_id>")
def delete_item(media_id):
    svc.delete_item(media_id)
    return no_content()


# ── Serve raw file ────────────────────────────────────────────────────────────
@camera_bp.get("/<media_id>/file")
def serve_file(media_id):
    item = svc.get_item(media_id)
    path = storage_service.get_absolute_path(item.filepath)
    return send_file(path, mimetype=item.mime_type or "application/octet-stream")


# ── Serve thumbnail ───────────────────────────────────────────────────────────
@camera_bp.get("/<media_id>/thumbnail")
def serve_thumbnail(media_id):
    item = svc.get_item(media_id)
    if not item.thumbnail:
        raise APIError("No thumbnail available", 404)
    path = storage_service.get_absolute_path(item.thumbnail)
    return send_file(path, mimetype="image/jpeg")


# ── Serializer — what the frontend receives ───────────────────────────────────
def _serialize(item) -> dict:
    d = item.to_dict()
    # Add convenience URL fields so Camera.js can display without extra requests
    d["file_url"]      = f"/api/v1/camera/{item.id}/file"
    d["thumbnail_url"] = f"/api/v1/camera/{item.id}/thumbnail" if item.thumbnail else None
    return d
EOF
echo "✅ app/api/camera.py"

# ─── 4. Register camera blueprint ─────────────────────────────────────────────
cat > backend/app/api/__init__.py << 'EOF'
from .media        import media_bp
from .camera       import camera_bp
from .events       import events_bp
from .contacts     import contacts_bp
from .projects     import projects_bp
from .transactions import transactions_bp
from .health_records import health_bp
from .files        import files_bp


def register_blueprints(app):
    prefix = "/api/v1"
    app.register_blueprint(camera_bp,       url_prefix=f"{prefix}/camera")
    app.register_blueprint(media_bp,        url_prefix=f"{prefix}/media")
    app.register_blueprint(events_bp,       url_prefix=f"{prefix}/events")
    app.register_blueprint(contacts_bp,     url_prefix=f"{prefix}/contacts")
    app.register_blueprint(projects_bp,     url_prefix=f"{prefix}/projects")
    app.register_blueprint(transactions_bp, url_prefix=f"{prefix}/transactions")
    app.register_blueprint(health_bp,       url_prefix=f"{prefix}/health")
    app.register_blueprint(files_bp,        url_prefix=f"{prefix}/files")
EOF
echo "✅ app/api/__init__.py (camera registered)"

# ─── 5. Camera tests ──────────────────────────────────────────────────────────
cat > backend/tests/unit/test_camera_service.py << 'EOF'
"""
Unit tests for CameraService.
These run against SQLite in-memory — no real disk writes needed.
"""
import pytest
from app.middleware.error_handlers import APIError


# ── base64 decode helper ──────────────────────────────────────────────────────
def test_decode_base64_with_header(app):
    from app.services.camera_service import CameraService
    with app.app_context():
        svc = CameraService()
        data_url = "data:image/jpeg;base64,/9j/4AAQSkZJRgAB"
        raw, ext = svc._decode_base64_image(data_url)
        assert ext == "jpeg"
        assert isinstance(raw, bytes)


def test_decode_bare_base64(app):
    from app.services.camera_service import CameraService
    import base64
    with app.app_context():
        svc = CameraService()
        b64 = base64.b64encode(b"fake image data").decode()
        raw, ext = svc._decode_base64_image(b64)
        assert ext == "jpg"
        assert raw == b"fake image data"


# ── upload_base64 validation ──────────────────────────────────────────────────
def test_upload_base64_empty_raises(app):
    from app.services.camera_service import CameraService
    with app.app_context():
        svc = CameraService()
        with pytest.raises(APIError) as exc:
            svc.upload_base64("")
        assert exc.value.status_code == 400


def test_upload_base64_invalid_data_raises(app):
    from app.services.camera_service import CameraService
    with app.app_context():
        svc = CameraService()
        with pytest.raises(APIError) as exc:
            svc.upload_base64("data:image/jpeg;base64,NOT_VALID_BASE64!!!")
        assert exc.value.status_code == 400


# ── get_item 404 ──────────────────────────────────────────────────────────────
def test_get_item_not_found(app):
    from app.services.camera_service import CameraService
    with app.app_context():
        svc = CameraService()
        with pytest.raises(APIError) as exc:
            svc.get_item("00000000-0000-0000-0000-000000000000")
        assert exc.value.status_code == 404


# ── save_edit 404 ─────────────────────────────────────────────────────────────
def test_save_edit_not_found(app):
    from app.services.camera_service import CameraService
    with app.app_context():
        svc = CameraService()
        with pytest.raises(APIError) as exc:
            svc.save_edit("nonexistent-id", caption="hello")
        assert exc.value.status_code == 404
EOF
echo "✅ tests/unit/test_camera_service.py"

cat > backend/tests/integration/test_camera_api.py << 'EOF'
"""
Integration tests for Camera API endpoints.
Uses in-memory SQLite — no real files written.
"""
import base64
import io
import pytest


def _make_tiny_jpeg_b64() -> str:
    """
    Returns a valid base64-encoded 1×1 white JPEG wrapped in a data-URL.
    PIL generates it at runtime so no fixture files needed.
    """
    from PIL import Image as PILImage
    buf = io.BytesIO()
    PILImage.new("RGB", (1, 1), color=(255, 255, 255)).save(buf, format="JPEG")
    b64 = base64.b64encode(buf.getvalue()).decode()
    return f"data:image/jpeg;base64,{b64}"


# ── GET /gallery — empty ──────────────────────────────────────────────────────
def test_gallery_empty(client):
    r = client.get("/api/v1/camera/gallery")
    assert r.status_code == 200
    data = r.get_json()
    assert data["success"] is True
    assert isinstance(data["data"], list)


# ── POST /photo — missing data_url ────────────────────────────────────────────
def test_upload_photo_no_data_url(client):
    r = client.post("/api/v1/camera/photo", json={})
    assert r.status_code == 400
    assert r.get_json()["success"] is False


# ── POST /photo — invalid base64 ─────────────────────────────────────────────
def test_upload_photo_bad_base64(client):
    r = client.post("/api/v1/camera/photo",
                    json={"data_url": "data:image/jpeg;base64,NOTVALID!!!"})
    assert r.status_code == 400


# ── POST /photo — valid tiny JPEG ────────────────────────────────────────────
def test_upload_photo_success(client, tmp_path, monkeypatch):
    """
    Monkeypatches _save_pil_image to write into pytest's tmp_path
    so no permanent files are created during tests.
    """
    from app.services.camera_service import CameraService
    from pathlib import Path

    def fake_save(self, img, ext):
        p = tmp_path / f"test.{ext}"
        img.save(str(p))
        return {
            "filename":  f"test.{ext}",
            "filepath":  f"images/test.{ext}",
            "thumbnail": f"thumbnails/test_thumb.jpg",
            "width": 1, "height": 1,
            "file_size": p.stat().st_size,
        }

    monkeypatch.setattr(CameraService, "_save_pil_image", fake_save)

    r = client.post("/api/v1/camera/photo", json={
        "data_url": _make_tiny_jpeg_b64(),
        "mode": "photo",
        "caption": "Test shot",
    })
    assert r.status_code == 201
    data = r.get_json()
    assert data["success"] is True
    assert data["data"]["caption"] == "Test shot"
    assert data["data"]["media_type"] == "image"
    assert "file_url" in data["data"]
    assert "thumbnail_url" in data["data"]
    return data["data"]["id"]


# ── PATCH /:id — save caption ────────────────────────────────────────────────
def test_save_edit_caption(client, tmp_path, monkeypatch):
    from app.services.camera_service import CameraService

    def fake_save(self, img, ext):
        p = tmp_path / f"edit.{ext}"
        img.save(str(p))
        return {"filename": f"edit.{ext}", "filepath": f"images/edit.{ext}",
                "thumbnail": None, "width": 1, "height": 1,
                "file_size": p.stat().st_size}

    monkeypatch.setattr(CameraService, "_save_pil_image", fake_save)

    # First create
    r1 = client.post("/api/v1/camera/photo", json={
        "data_url": _make_tiny_jpeg_b64(), "mode": "portrait",
    })
    assert r1.status_code == 201
    media_id = r1.get_json()["data"]["id"]

    # Then edit caption
    r2 = client.patch(f"/api/v1/camera/{media_id}",
                      json={"caption": "Updated caption"})
    assert r2.status_code == 200
    assert r2.get_json()["data"]["caption"] == "Updated caption"


# ── DELETE /:id ───────────────────────────────────────────────────────────────
def test_delete_item(client, tmp_path, monkeypatch):
    from app.services.camera_service import CameraService
    from app.storage.storage_service import StorageService

    def fake_save(self, img, ext):
        p = tmp_path / f"del.{ext}"
        img.save(str(p))
        return {"filename": f"del.{ext}", "filepath": f"images/del.{ext}",
                "thumbnail": None, "width": 1, "height": 1,
                "file_size": p.stat().st_size}

    monkeypatch.setattr(CameraService, "_save_pil_image", fake_save)
    monkeypatch.setattr(StorageService, "delete_file", lambda self, p: True)

    r1 = client.post("/api/v1/camera/photo",
                     json={"data_url": _make_tiny_jpeg_b64()})
    assert r1.status_code == 201
    media_id = r1.get_json()["data"]["id"]

    r2 = client.delete(f"/api/v1/camera/{media_id}")
    assert r2.status_code == 204

    r3 = client.get(f"/api/v1/camera/{media_id}")
    assert r3.status_code == 404


# ── GET /recent ───────────────────────────────────────────────────────────────
def test_recent(client):
    r = client.get("/api/v1/camera/gallery/recent")
    assert r.status_code == 200
    assert isinstance(r.get_json()["data"], list)


# ── GET /:id — not found ──────────────────────────────────────────────────────
def test_get_nonexistent(client):
    r = client.get("/api/v1/camera/00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404
EOF
echo "✅ tests/integration/test_camera_api.py"

echo ""
echo "========================================"
echo "  PHASE 1 FILES WRITTEN"
echo "========================================"
echo ""
echo "Now wire Camera.js to the backend."
echo "Add this helper to Camera.js (at the top, after imports):"
echo ""
echo "  const API = 'http://localhost:5001/api/v1/camera';"
echo ""
echo "Then run tests:"
echo "  cd backend && pytest tests/ -v"
SCRIPT
echo "Script ready"
