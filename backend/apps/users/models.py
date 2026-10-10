from django.contrib.auth.models import AbstractUser
from django.db import models

from apps.core.uploads import build_upload_path
from apps.core.validators import validate_image_upload


def profile_picture_upload_path(instance, filename):
    return build_upload_path("profile_pictures", filename)


class User(AbstractUser):
    email = models.EmailField(unique=True)
    bio = models.CharField(max_length=300, blank=True)
    profile_picture = models.ImageField(
        upload_to=profile_picture_upload_path,
        blank=True,
        null=True,
        validators=[validate_image_upload],
    )
    updated_at = models.DateTimeField(auto_now=True)

    REQUIRED_FIELDS = ["email"]

    class Meta:
        ordering = ["-date_joined"]
        indexes = [
            models.Index(fields=["first_name", "last_name"]),
        ]

    def save(self, *args, **kwargs):
        self.email = self.email.lower()
        super().save(*args, **kwargs)

    @property
    def full_name(self):
        return self.get_full_name()

    def __str__(self):
        return self.username
