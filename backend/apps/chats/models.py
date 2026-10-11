# backend/apps/chats/models.py
from django.conf import settings
from django.db import models
from django.utils import timezone


class Conversation(models.Model):
    """One conversation per pair of users. user_a always has the smaller id, so the pair is unique."""

    user_a = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="conversations_as_a"
    )
    user_b = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="conversations_as_b"
    )
    last_message_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-last_message_at", "-id"]
        constraints = [
            models.UniqueConstraint(fields=["user_a", "user_b"], name="unique_conversation")
        ]
        indexes = [
            models.Index(fields=["user_a", "-last_message_at"]),
            models.Index(fields=["user_b", "-last_message_at"]),
        ]

    def __str__(self):
        return f"{self.user_a} <-> {self.user_b}"


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages"
    )
    text = models.CharField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        indexes = [
            models.Index(fields=["conversation", "-created_at"]),
            models.Index(fields=["conversation", "read_at"]),
        ]

    def __str__(self):
        return f"Message {self.pk} in {self.conversation_id}"