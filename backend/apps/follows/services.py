from django.db import transaction
from django.db.models import Exists, OuterRef
from rest_framework.exceptions import ValidationError

from apps.notifications import services as notification_services
from apps.notifications.models import Notification

from .models import Follow


def annotate_is_following(queryset, viewer):
    """Annotate a User queryset with whether `viewer` follows each user (one query, no N+1)."""
    return queryset.annotate(
        is_following=Exists(Follow.objects.filter(follower=viewer, following=OuterRef("pk")))
    )


def followers_count(user):
    return Follow.objects.filter(following=user).count()


@transaction.atomic
def follow(follower, target):
    """Returns True if a new relationship was created, False if it already existed."""
    if follower.pk == target.pk:
        raise ValidationError("You cannot follow yourself.")
    _, created = Follow.objects.get_or_create(follower=follower, following=target)
    if created:
        notification_services.notify(
            recipient=target, sender=follower, notification_type=Notification.Type.FOLLOW
        )
    return created


@transaction.atomic
def unfollow(follower, target):
    """Returns True if a relationship was removed."""
    deleted, _ = Follow.objects.filter(follower=follower, following=target).delete()
    if deleted:
        notification_services.remove_notification(
            recipient=target, sender=follower, notification_type=Notification.Type.FOLLOW
        )
    return deleted > 0
