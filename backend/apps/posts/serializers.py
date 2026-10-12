from rest_framework import serializers

from apps.users.serializers import AuthorSerializer

from .models import Post


class PostSerializer(serializers.ModelSerializer):
    """Read representation. Counts and is_liked come from queryset annotations."""

    user = AuthorSerializer(read_only=True)
    media_type = serializers.CharField(read_only=True)
    likes_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    is_liked = serializers.BooleanField(read_only=True)

    class Meta:
        model = Post
        fields = (
            "id",
            "user",
            "image",
            "video",
            "media_type",
            "caption",
            "likes_count",
            "comments_count",
            "is_liked",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class PostCreateSerializer(serializers.ModelSerializer):
    """multipart/form-data: a photo (`image`) or a video (`video`, with an optional cover `image`)."""

    class Meta:
        model = Post
        fields = ("image", "video", "caption")
        extra_kwargs = {
            "image": {"required": False},
            "video": {"required": False},
            "caption": {"required": False, "allow_blank": True},
        }

    def validate(self, attrs):
        if not attrs.get("image") and not attrs.get("video"):
            raise serializers.ValidationError("Choose a photo or a video.")
        return attrs


class PostUpdateSerializer(serializers.ModelSerializer):
    """Only the caption can be edited; the media is immutable."""

    class Meta:
        model = Post
        fields = ("caption",)
        extra_kwargs = {"caption": {"required": False, "allow_blank": True}}