from django.test import SimpleTestCase, override_settings

from apps.core.storage import CloudinaryMediaStorage


@override_settings(CLOUDINARY_CLOUD_NAME="democloud")
class CloudinaryStorageTests(SimpleTestCase):
    def setUp(self):
        self.storage = CloudinaryMediaStorage()

    def test_image_url(self):
        self.assertEqual(
            self.storage.url("posts/abc.png"),
            "https://res.cloudinary.com/democloud/image/upload/posts/abc.png",
        )

    def test_video_url(self):
        self.assertEqual(
            self.storage.url("post_videos/xyz.mp4"),
            "https://res.cloudinary.com/democloud/video/upload/post_videos/xyz.mp4",
        )

    def test_resource_type_by_extension(self):
        self.assertEqual(self.storage._resource_type("post_videos/a.MOV"), "video")
        self.assertEqual(self.storage._resource_type("profile_pictures/a.webp"), "image")