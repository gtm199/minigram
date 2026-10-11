# backend/apps/chats/admin.py
from django.contrib import admin

from .models import Conversation, Message


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "user_a", "user_b", "last_message_at")
    search_fields = ("user_a__username", "user_b__username")
    ordering = ("-last_message_at",)
    raw_id_fields = ("user_a", "user_b")


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "conversation", "sender", "short_text", "created_at", "read_at")
    search_fields = ("sender__username", "text")
    list_filter = ("created_at",)
    ordering = ("-created_at",)
    raw_id_fields = ("conversation", "sender")

    @admin.display(description="Text")
    def short_text(self, obj):
        return obj.text[:50]