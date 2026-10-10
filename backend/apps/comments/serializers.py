from rest_framework import serializers

from apps.users.serializers import AuthorSerializer

from .models import Comment


class CommentSerializer(serializers.ModelSerializer):
    user = AuthorSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ("id", "user", "post", "text", "created_at")
        read_only_fields = ("id", "user", "post", "created_at")
