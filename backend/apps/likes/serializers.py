from rest_framework import serializers

from apps.users.serializers import AuthorSerializer

from .models import Like


class LikeSerializer(serializers.ModelSerializer):
    user = AuthorSerializer(read_only=True)

    class Meta:
        model = Like
        fields = ("id", "user", "created_at")
        read_only_fields = fields


class LikeStateSerializer(serializers.Serializer):
    is_liked = serializers.BooleanField()
    likes_count = serializers.IntegerField()
