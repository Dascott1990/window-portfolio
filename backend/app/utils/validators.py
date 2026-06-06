from app.middleware.error_handlers import APIError


def require_fields(data: dict, *fields):
    missing = [f for f in fields if not data.get(f)]
    if missing:
        raise APIError(f"Missing required fields: {', '.join(missing)}", 400)


def validate_date(date_str: str) -> bool:
    from datetime import datetime
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
        return True
    except (ValueError, TypeError):
        return False


def validate_time(time_str: str) -> bool:
    from datetime import datetime
    for fmt in ("%H:%M", "%H:%M:%S"):
        try:
            datetime.strptime(time_str, fmt)
            return True
        except (ValueError, TypeError):
            pass
    return False
