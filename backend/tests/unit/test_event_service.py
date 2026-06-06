import pytest
from app.middleware.error_handlers import APIError


def test_create_event_missing_fields(app):
    from app.services.event_service import EventService
    with app.app_context():
        with pytest.raises(APIError) as exc:
            EventService().create({"title": "Test"})
        assert exc.value.status_code == 400


def test_invalid_date_raises(app):
    from app.services.event_service import EventService
    with app.app_context():
        with pytest.raises(APIError):
            EventService().create({"title": "X", "event_date": "bad", "event_time": "09:00"})


def test_invalid_reminder_raises(app):
    from app.services.event_service import EventService
    with app.app_context():
        with pytest.raises(APIError):
            EventService().create({
                "title": "T", "event_date": "2026-12-01",
                "event_time": "10:00", "reminder": "bad_value",
            })
