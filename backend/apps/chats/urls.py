# backend/apps/chats/urls.py
from django.urls import path

from .views import ConversationListCreateView, MarkReadView, MessageListCreateView, UnreadCountView

urlpatterns = [
    path("", ConversationListCreateView.as_view(), name="chat-list"),
    path("unread-count/", UnreadCountView.as_view(), name="chat-unread-count"),
    path("<int:conversation_id>/messages/", MessageListCreateView.as_view(), name="chat-messages"),
    path("<int:conversation_id>/read/", MarkReadView.as_view(), name="chat-read"),
]