from django.conf import settings
from django.db import models

from apps.core.uploads import build_upload_path
from apps.core.validators import validate_image_upload


def post_image_upload_path(instance, filename):
    return build_upload_path("posts", filename)


class Post(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="posts")
    image = models.ImageField(upload_to=post_image_upload_path, validators=[validate_image_upload])
    caption = models.CharField(max_length=2200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        return f"Post {self.pk} by {self.user}"
