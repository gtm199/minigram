import io
import shutil
import tempfile

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image
from rest_framework.test import APITestCase

PASSWORD = "Str0ng!Pass#2026"


def make_user(username="alice", **extra):
    return get_user_model().objects.create_user(
        username=username, email=f"{username}@example.com", password=PASSWORD, **extra
    )


def make_image(name="photo.png", size=(200, 200), fmt="PNG"):
    buffer = io.BytesIO()
    Image.new("RGB", size, "red").save(buffer, fmt)
    return SimpleUploadedFile(name, buffer.getvalue(), content_type=f"image/{fmt.lower()}")


class APITestBase(APITestCase):
    """Writes uploads to a throwaway MEDIA_ROOT so tests never touch real media."""

    @classmethod
    def setUpClass(cls):
        cls._media_dir = tempfile.mkdtemp()
        cls._override = override_settings(MEDIA_ROOT=cls._media_dir)
        cls._override.enable()
        super().setUpClass()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        cls._override.disable()
        shutil.rmtree(cls._media_dir, ignore_errors=True)

    def setUp(self):
        super().setUp()
        cache.clear()  # throttle counters live in the cache; keep tests independent

    def login(self, user):
        self.client.force_authenticate(user)
        return user
