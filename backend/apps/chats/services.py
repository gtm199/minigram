# backend/apps/chats/services.py
from django.db import transaction
from django.db.models import Count, IntegerField, OuterRef, Q, Subquery
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import Conversation, Message


def conversations_for(user):
    return Conversation.objects.filter(Q(user_a=user) | Q(user_b=user))


def annotate_conversations(queryset, user):
    """Adds last message info and unread count in one query (no N+1)."""
    last = Message.objects.filter(conversation=OuterRef("pk")).order_by("-created_at", "-id")
    unread = (
        Message.objects.filter(conversation=OuterRef("pk"), read_at__isnull=True)
        .exclude(sender=user)
        .order_by()
        .values("conversation")
        .annotate(total=Count("pk"))
        .values("total")
    )
    return queryset.select_related("user_a", "user_b").annotate(
        last_text=Subquery(last.values("text")[:1]),
        last_sender_id=Subquery(last.values("sender_id")[:1]),
        last_created_at=Subquery(last.values("created_at")[:1]),
        unread_count=Coalesce(Subquery(unread, output_field=IntegerField()), 0, output_field=IntegerField()),
    )


def get_or_create_conversation(user, other):
    """Returns (conversation, created)."""
    if user.pk == other.pk:
        raise ValidationError("You cannot message yourself.")
    first, second = sorted((user, other), key=lambda u: u.pk)
    return Conversation.objects.get_or_create(user_a=first, user_b=second)


@transaction.atomic
def send_message(conversation, sender, text):
    message = Message.objects.create(conversation=conversation, sender=sender, text=text)
    Conversation.objects.filter(pk=conversation.pk).update(last_message_at=message.created_at)
    return message


def mark_read(conversation, user):
    """Mark the other person's unread messages as read. Returns how many changed."""
    return (
        Message.objects.filter(conversation=conversation, read_at__isnull=True)
        .exclude(sender=user)
        .update(read_at=timezone.now())
    )


def unread_total(user):
    return (
        Message.objects.filter(conversation__in=conversations_for(user), read_at__isnull=True)
        .exclude(sender=user)
        .count()
    )