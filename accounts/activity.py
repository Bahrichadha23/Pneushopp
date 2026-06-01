"""
Utility for logging user activity in the back-office.
Logs to both the DB (UserActivityLog) and a JSON-lines flat file for precision.
"""
import json
import os
from datetime import datetime, timezone as dt_tz

# Path to the flat-file activity log (relative to Django BASE_DIR / project root)
ACTIVITY_LOG_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "logs", "activity.log"
)


def _ensure_log_dir():
    log_dir = os.path.dirname(ACTIVITY_LOG_PATH)
    os.makedirs(log_dir, exist_ok=True)


def _write_to_file(entry: dict):
    """Append a JSON-line entry to the activity log file."""
    try:
        _ensure_log_dir()
        with open(ACTIVITY_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception:
        pass  # Never crash on logging failure


def log_activity(user, action: str, description: str, request=None,
                 target_email: str = '', extra=None):
    """
    Create a UserActivityLog DB entry AND append to the flat-file log.
    action must be one of the ACTION_CHOICES keys defined in UserActivityLog.
    extra: optional dict with additional details (e.g. old/new price, product id…)
    """
    from .models import UserActivityLog

    ip = None
    if request:
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        ip = (
            x_forwarded.split(',')[0].strip()
            if x_forwarded
            else request.META.get('REMOTE_ADDR')
        )

    # ── DB log ────────────────────────────────────────────────────────────────
    try:
        UserActivityLog.objects.create(
            user=user,
            action=action,
            description=description,
            target_user_email=target_email,
            ip_address=ip,
        )
    except Exception:
        pass

    # ── File log ──────────────────────────────────────────────────────────────
    user_name = ""
    user_email = ""
    user_role = ""
    try:
        user_name = f"{user.first_name} {user.last_name}".strip() or user.username
        user_email = user.email
        user_role = getattr(user, 'role', '')
    except Exception:
        pass

    entry = {
        "ts": datetime.now(dt_tz.utc).isoformat(),
        "action": action,
        "user_name": user_name,
        "user_email": user_email,
        "user_role": user_role,
        "description": description,
        "target_email": target_email,
        "ip": ip or "",
    }
    if extra:
        entry["extra"] = extra

    _write_to_file(entry)
