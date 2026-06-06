import base64
import io
import pytest


def _tiny_jpeg_b64() -> str:
    from PIL import Image as PILImage
    buf = io.BytesIO()
    PILImage.new("RGB", (1, 1), color=(255, 255, 255)).save(buf, format="JPEG")
    b64 = base64.b64encode(buf.getvalue()).decode()
    return f"data:image/jpeg;base64,{b64}"


def test_gallery_empty(client):
    r = client.get("/api/v1/camera/gallery")
    assert r.status_code == 200
    assert isinstance(r.get_json()["data"], list)


def test_recent_empty(client):
    r = client.get("/api/v1/camera/gallery/recent")
    assert r.status_code == 200
    assert isinstance(r.get_json()["data"], list)


def test_upload_photo_no_data_url(client):
    r = client.post("/api/v1/camera/photo", json={})
    assert r.status_code == 400
    assert r.get_json()["success"] is False


def test_upload_photo_bad_base64(client):
    r = client.post("/api/v1/camera/photo",
                    json={"data_url": "data:image/jpeg;base64,NOTVALID!!!"})
    assert r.status_code == 400


def test_upload_photo_success(client, tmp_path, monkeypatch):
    from app.services.camera_service import CameraService

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
        "data_url": _tiny_jpeg_b64(),
        "mode": "photo",
        "caption": "Test shot",
    })
    assert r.status_code == 201
    data = r.get_json()["data"]
    assert data["caption"] == "Test shot"
    assert data["media_type"] == "image"
    assert "file_url" in data
    assert "thumbnail_url" in data


def test_save_edit_caption(client, tmp_path, monkeypatch):
    from app.services.camera_service import CameraService

    def fake_save(self, img, ext):
        p = tmp_path / f"edit.{ext}"
        img.save(str(p))
        return {"filename": f"edit.{ext}", "filepath": f"images/edit.{ext}",
                "thumbnail": None, "width": 1, "height": 1,
                "file_size": p.stat().st_size}

    monkeypatch.setattr(CameraService, "_save_pil_image", fake_save)

    r1 = client.post("/api/v1/camera/photo", json={
        "data_url": _tiny_jpeg_b64(), "mode": "portrait",
    })
    assert r1.status_code == 201
    media_id = r1.get_json()["data"]["id"]

    r2 = client.patch(f"/api/v1/camera/{media_id}",
                      json={"caption": "Updated caption"})
    assert r2.status_code == 200
    assert r2.get_json()["data"]["caption"] == "Updated caption"


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
                     json={"data_url": _tiny_jpeg_b64()})
    assert r1.status_code == 201
    media_id = r1.get_json()["data"]["id"]

    r2 = client.delete(f"/api/v1/camera/{media_id}")
    assert r2.status_code == 204

    r3 = client.get(f"/api/v1/camera/{media_id}")
    assert r3.status_code == 404


def test_get_nonexistent(client):
    r = client.get("/api/v1/camera/00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404
