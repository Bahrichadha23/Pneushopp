"""
Utility for logging user activity in the back-office.
Import this module from any Django app to avoid circular imports with accounts.views.
"""


def log_activity(user, action: str, description: str, request=None, target_email: str = ''):
    """
    Create a UserActivityLog entry.
    action must be one of the ACTION_CHOICES keys defined in UserActivityLog.
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
    UserActivityLog.objects.create(
        user=user,
        action=action,
        description=description,
        target_user_email=target_email,
        ip_address=ip,
    )
