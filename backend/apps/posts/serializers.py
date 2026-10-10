from rest_framework import serializers

from apps.users.serializers import AuthorSerializer

from .models import Post


class PostSerializer(serializers.ModelSerializer):
    """Read representation. Counts and is_liked come from queryset annotations."""

    user = AuthorSerializer(read_only=True)
    likes_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    is_liked = serializers.BooleanField(read_only=True)

    class Meta:
        model = Post
        fields = (
            "id",
            "user",
            "image",
            "caption",
            "likes_count",
            "comments_count",
            "is_liked",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class PostCreateSerializer(serializers.ModelSerializer):
    """multipart/form-data: image (required) + caption."""

    class Meta:
        model = Post
        fields = ("image", "caption")
        extra_kwargs = {"caption": {"required": False, "allow_blank": True}}


class PostUpdateSerializer(serializers.ModelSerializer):
    """Only the caption can be edited; the image is immutable."""

    class Meta:
        model = Post
        fields = ("caption",)
        extra_kwargs = {"caption": {"required": False, "allow_blank": True}}
