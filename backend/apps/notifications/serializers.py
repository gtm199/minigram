from rest_framework import serializers

from apps.posts.models import Post
from apps.users.serializers import AuthorSerializer

from .models import Notification


class NotificationPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ("id", "image")
        read_only_fields = fields


class NotificationSerializer(serializers.ModelSerializer):
    sender = AuthorSerializer(read_only=True)
    post = NotificationPostSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = ("id", "sender", "notification_type", "post", "is_read", "created_at")
        read_only_fields = fields


class UnreadCountSerializer(serializers.Serializer):
    count = serializers.IntegerField()
