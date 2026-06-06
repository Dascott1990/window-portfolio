def test_is_allowed_image(app):
    from app.storage import storage_service
    with app.app_context():
        assert storage_service.is_allowed_image("photo.jpg") is True
        assert storage_service.is_allowed_image("file.exe") is False


def test_is_allowed_video(app):
    from app.storage import storage_service
    with app.app_context():
        assert storage_service.is_allowed_video("clip.mp4") is True
        assert storage_service.is_allowed_video("photo.jpg") is False


def test_file_not_exists(app):
    from app.storage import storage_service
    with app.app_context():
        assert storage_service.file_exists("images/nonexistent.jpg") is False
