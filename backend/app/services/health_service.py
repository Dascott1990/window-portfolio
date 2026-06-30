from datetime import datetime, timezone
from app.repositories.health_repository import HealthRepository
from app.middleware.error_handlers import APIError


class HealthService:
    def __init__(self):
        self.repo = HealthRepository()

    # ── Lift Logger ──────────────────────────────────────────────────────────
    LIFT_WEIGHT_SCORE = {"under_25": 0, "25_50": 1, "50_75": 2, "over_75": 3}
    LIFT_TYPE_SCORE    = {"floor_to_waist": 0, "awkward_angle": 1, "repetitive": 1, "overhead": 2}
    LIFT_GUIDANCE = {
        "high_risk": "High-risk lift — use a team lift or mechanical aid, and take a recovery break before continuing.",
        "moderate":  "Moderate risk. Keep the load close to your body and lift with your legs, not your back.",
    }
    FATIGUE_VALUE = {"rested": 0, "tired": 1, "very_fatigued": 2}

    def _score_lift(self, weight_band, lift_type, repetitions, used_team_lift):
        rep_score = 2 if repetitions >= 10 else 1 if repetitions >= 5 else 0
        raw = (
            self.LIFT_WEIGHT_SCORE.get(weight_band, 0)
            + self.LIFT_TYPE_SCORE.get(lift_type, 0)
            + rep_score
        )
        total = max(0, raw - (1 if used_team_lift else 0))
        if total >= 5:
            return "high_risk"
        if total >= 3:
            return "moderate"
        return "low"

    def log_lift(self, data: dict):
        weight_band = data.get("weight_band")
        lift_type   = data.get("lift_type")
        if weight_band not in self.LIFT_WEIGHT_SCORE or lift_type not in self.LIFT_TYPE_SCORE:
            raise APIError("weight_band and lift_type are required", 400)

        try:
            repetitions = int(data.get("repetitions") or 0)
        except (TypeError, ValueError):
            raise APIError("repetitions must be a number", 400)

        used_team_lift = bool(data.get("used_team_lift"))
        risk_level = self._score_lift(weight_band, lift_type, repetitions, used_team_lift)

        record = self.repo.create(
            record_type="lift_log",
            value=float({"low": 0, "moderate": 1, "high_risk": 2}[risk_level]),
            unit=None,
            recorded_at=datetime.now(timezone.utc),
            notes=None,
            metadata_json={
                "weight_band":      weight_band,
                "lift_type":        lift_type,
                "repetitions":      repetitions,
                "used_team_lift":   used_team_lift,
                "crew_member_id":   data.get("crew_member_id"),
                "crew_member_name": data.get("crew_member_name"),
                "risk_level":       risk_level,
            },
        )
        return {**record.to_dict(), "guidance": self.LIFT_GUIDANCE.get(risk_level)}

    def get_lift_today(self):
        logs = self.repo.get_today_records("lift_log")
        high_risk = sum(1 for r in logs if (r.metadata_json or {}).get("risk_level") == "high_risk")
        moderate  = sum(1 for r in logs if (r.metadata_json or {}).get("risk_level") == "moderate")
        return {
            "total": len(logs),
            "high_risk": high_risk,
            "moderate": moderate,
            "logs": [r.to_dict() for r in logs],
        }

    # ── Fatigue Check-in ──────────────────────────────────────────────────────
    def log_fatigue(self, data: dict):
        level = data.get("fatigue_level")
        if level not in self.FATIGUE_VALUE:
            raise APIError("fatigue_level must be one of rested, tired, very_fatigued", 400)

        flagged = level == "very_fatigued"
        record = self.repo.create(
            record_type="fatigue_checkin",
            value=float(self.FATIGUE_VALUE[level]),
            unit=None,
            recorded_at=datetime.now(timezone.utc),
            notes=None,
            metadata_json={
                "fatigue_level":      level,
                "shift_type":         data.get("shift_type"),
                "hours_slept":        data.get("hours_slept"),
                "crew_member_id":     data.get("crew_member_id"),
                "crew_member_name":   data.get("crew_member_name"),
                "flagged_supervisor": flagged,
            },
        )
        return {**record.to_dict(), "flagged_supervisor": flagged}

    def get_fatigue_today(self):
        logs = self.repo.get_today_records("fatigue_checkin")
        flagged = sum(1 for r in logs if (r.metadata_json or {}).get("flagged_supervisor"))
        return {"total": len(logs), "flagged": flagged, "logs": [r.to_dict() for r in logs]}

    # ── Roster ────────────────────────────────────────────────────────────────
    def list_crew(self):
        return self.repo.get_active_by_type("crew_member")

    def add_crew_member(self, data: dict):
        name = (data.get("name") or "").strip()
        if not name:
            raise APIError("name is required", 400)
        return self.repo.create(
            record_type="crew_member",
            value=1.0 if data.get("is_supervisor") else 0.0,
            unit=None,
            recorded_at=datetime.now(timezone.utc),
            notes=None,
            metadata_json={
                "name":          name,
                "role_title":    data.get("role_title"),
                "crew_name":     data.get("crew_name"),
                "is_supervisor": bool(data.get("is_supervisor")),
            },
        )

    def get_roster(self):
        crew          = self.repo.get_active_by_type("crew_member")
        lifts_7d      = self.repo.get_recent_by_type("lift_log", days=7)
        fatigue_today = self.repo.get_today_records("fatigue_checkin")

        high_risk_by_member = {}
        for log in lifts_7d:
            meta = log.metadata_json or {}
            if meta.get("risk_level") == "high_risk" and meta.get("crew_member_id"):
                high_risk_by_member[meta["crew_member_id"]] = high_risk_by_member.get(meta["crew_member_id"], 0) + 1

        flagged_members = {
            (f.metadata_json or {}).get("crew_member_id")
            for f in fatigue_today
            if (f.metadata_json or {}).get("flagged_supervisor") and (f.metadata_json or {}).get("crew_member_id")
        }

        counts  = {"clear": 0, "high_risk": 0, "fatigue_flagged": 0}
        members = []
        for c in crew:
            meta            = c.metadata_json or {}
            high_risk_lifts = high_risk_by_member.get(c.id, 0)
            if c.id in flagged_members:
                status = "fatigue_flagged"
            elif high_risk_lifts > 0:
                status = "high_risk"
            else:
                status = "clear"
            counts[status] += 1
            members.append({
                "id":                 c.id,
                "name":               meta.get("name"),
                "role_title":         meta.get("role_title"),
                "crew_name":          meta.get("crew_name"),
                "is_supervisor":      meta.get("is_supervisor", False),
                "status":             status,
                "high_risk_lifts_7d": high_risk_lifts,
            })

        return {"summary": counts, "crew": members}