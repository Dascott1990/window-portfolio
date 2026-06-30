from flask import Blueprint, request
from app.services.health_service import HealthService
from app.utils.response import success, created

health_bp = Blueprint("health", __name__)
svc       = HealthService()


@health_bp.post("/lift")
def log_lift():
    result = svc.log_lift(request.get_json(force=True))
    return created(result, "Lift logged")


@health_bp.get("/lift/today")
def lift_today():
    return success(svc.get_lift_today())


@health_bp.post("/fatigue")
def log_fatigue():
    result = svc.log_fatigue(request.get_json(force=True))
    return created(result, "Check-in recorded")


@health_bp.get("/fatigue/today")
def fatigue_today():
    return success(svc.get_fatigue_today())


@health_bp.get("/crew")
def list_crew():
    return success([c.to_dict() for c in svc.list_crew()])


@health_bp.post("/crew")
def add_crew_member():
    record = svc.add_crew_member(request.get_json(force=True))
    return created(record.to_dict(), "Crew member added")


@health_bp.get("/roster")
def get_roster():
    return success(svc.get_roster())