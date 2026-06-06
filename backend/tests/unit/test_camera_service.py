import pytest
import base64
from app.middleware.error_handlers import APIError


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
    with app.app_context():
        svc = CameraService()
        b64 = base64.b64encode(b"fake image data").decode()
        raw, ext = svc._decode_base64_image(b64)
        assert ext == "jpg"
        assert raw == b"fake image data"


def test_upload_base64_empty_raises(app):
    from app.services.camera_service import CameraService
    with app.app_context():
        with pytest.raises(APIError) as exc:
            CameraService().upload_base64("")
        assert exc.value.status_code == 400


def test_upload_base64_invalid_raises(app):
    from app.services.camera_service import CameraService
    with app.app_context():
        with pytest.raises(APIError) as exc:
            CameraService().upload_base64("data:image/jpeg;base64,NOT_VALID!!!")
        assert exc.value.status_code == 400


def test_get_item_not_found(app):
    from app.services.camera_service import CameraService
    with app.app_context():
        with pytest.raises(APIError) as exc:
            CameraService().get_item("00000000-0000-0000-0000-000000000000")
        assert exc.value.status_code == 404


def test_save_edit_not_found(app):
    from app.services.camera_service import CameraService
    with app.app_context():
        with pytest.raises(APIError) as exc:
            CameraService().save_edit("nonexistent-id", caption="hello")
        assert exc.value.status_code == 404
