from .models import Notification


def notify(*, recipient, sender, notification_type, post=None):
    """Create a notification. Never notifies users about their own actions.

    LIKE and FOLLOW are de-duplicated (one per sender/target); every COMMENT is kept.
    """
    if recipient.pk == sender.pk:
        return None
    if notification_type in (Notification.Type.LIKE, Notification.Type.FOLLOW):
        notification, _ = Notification.objects.get_or_create(
            recipient=recipient, sender=sender, notification_type=notification_type, post=post
        )
        return notification
    return Notification.objects.create(
        recipient=recipient, sender=sender, notification_type=notification_type, post=post
    )


def remove_notification(*, recipient, sender, notification_type, post=None):
    """Called on unlike/unfollow so a later like/follow notifies again."""
    Notification.objects.filter(
        recipient=recipient, sender=sender, notification_type=notification_type, post=post
    ).delete()


def mark_all_read(user):
    return Notification.objects.filter(recipient=user, is_read=False).update(is_read=True)


def unread_count(user):
    return Notification.objects.filter(recipient=user, is_read=False).count()
