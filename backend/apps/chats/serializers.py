# backend/apps/chats/serializers.py
from rest_framework import serializers

from apps.users.serializers import AuthorSerializer

from .models import Conversation, Message


class StartConversationSerializer(serializers.Serializer):
    username = serializers.CharField()


class ConversationSerializer(serializers.ModelSerializer):
    other_user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Conversation
        fields = ("id", "other_user", "last_message", "unread_count", "last_message_at")
        read_only_fields = fields

    def get_other_user(self, obj):
        me = self.context["request"].user
        other = obj.user_b if obj.user_a_id == me.id else obj.user_a
        return AuthorSerializer(other, context=self.context).data

    def get_last_message(self, obj):
        text = getattr(obj, "last_text", None)
        if text is None:
            return None
        return {
            "text": text,
            "sender_id": obj.last_sender_id,
            "created_at": obj.last_created_at,
        }


class MessageSerializer(serializers.ModelSerializer):
    sender = AuthorSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ("id", "conversation", "sender", "text", "created_at", "read_at")
        read_only_fields = ("id", "conversation", "sender", "created_at", "read_at")