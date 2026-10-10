from django.db import transaction

from apps.notifications import services as notification_services
from apps.notifications.models import Notification

from .models import Comment


@transaction.atomic
def add_comment(user, post, text):
    comment = Comment.objects.create(user=user, post=post, text=text)
    notification_services.notify(
        recipient=post.user,
        sender=user,
        notification_type=Notification.Type.COMMENT,
        post=post,
    )
    return comment
