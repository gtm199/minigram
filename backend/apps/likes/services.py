from django.db import transaction

from apps.notifications import services as notification_services
from apps.notifications.models import Notification

from .models import Like


def like_state(user, post):
    return {
        "is_liked": Like.objects.filter(user=user, post=post).exists(),
        "likes_count": Like.objects.filter(post=post).count(),
    }


@transaction.atomic
def like_post(user, post):
    """Returns True if the like was created, False if the user had already liked the post."""
    _, created = Like.objects.get_or_create(user=user, post=post)
    if created:
        notification_services.notify(
            recipient=post.user,
            sender=user,
            notification_type=Notification.Type.LIKE,
            post=post,
        )
    return created


@transaction.atomic
def unlike_post(user, post):
    """Returns True if a like was removed."""
    deleted, _ = Like.objects.filter(user=user, post=post).delete()
    if deleted:
        notification_services.remove_notification(
            recipient=post.user,
            sender=user,
            notification_type=Notification.Type.LIKE,
            post=post,
        )
    return deleted > 0
