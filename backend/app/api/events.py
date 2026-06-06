from flask import Blueprint, request
from app.services.event_service import EventService
from app.utils.response import success, created, no_content

events_bp = Blueprint("events", __name__)
svc       = EventService()


@events_bp.get("")
def list_events():
    date_str = request.args.get("date")
    year     = request.args.get("year", type=int)
    month    = request.args.get("month", type=int)
    if date_str:
        events = svc.get_by_date(date_str)
    elif year and month:
        events = svc.get_by_month(year, month)
    else:
        from app.repositories import EventRepository
        events = EventRepository().get_all_unpaginated()
    return success([e.to_dict() for e in events])


@events_bp.post("")
def create_event():
    return created(svc.create(request.get_json(force=True)).to_dict(), "Event created")


@events_bp.get("/<event_id>")
def get_event(event_id):
    return success(svc.get_one(event_id).to_dict())


@events_bp.patch("/<event_id>")
def update_event(event_id):
    return success(svc.update(event_id, request.get_json(force=True)).to_dict(), "Event updated")


@events_bp.delete("/<event_id>")
def delete_event(event_id):
    svc.delete(event_id)
    return no_content()
