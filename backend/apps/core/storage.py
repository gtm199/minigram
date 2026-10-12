import os
from urllib.parse import quote

import cloudinary.uploader
from django.conf import settings
from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible

VIDEO_EXTENSIONS = {".mp4", ".mov", ".m4v"}


@deconstructible
class CloudinaryMediaStorage(Storage):
    """Stores uploads on Cloudinary. The database keeps names like 'posts/<uuid>.png'.

    Upload paths come from apps.core.uploads (random names, whitelisted extensions),
    so the extension reliably tells us whether an asset is an image or a video.
    """

    @staticmethod
    def _resource_type(name):
        return "video" if os.path.splitext(name)[1].lower() in VIDEO_EXTENSIONS else "image"

    def _save(self, name, content):
        public_id, _extension = os.path.splitext(name)
        content.seek(0)
        cloudinary.uploader.upload(
            content,
            public_id=public_id,
            resource_type=self._resource_type(name),
            overwrite=False,
            use_filename=False,
            unique_filename=False,
        )
        return name

    def url(self, name):
        resource_type = self._resource_type(name)
        return (
            f"https://res.cloudinary.com/{settings.CLOUDINARY_CLOUD_NAME}"
            f"/{resource_type}/upload/{quote(name)}"
        )

    def delete(self, name):
        public_id, _extension = os.path.splitext(name)
        cloudinary.uploader.destroy(
            public_id, resource_type=self._resource_type(name), invalidate=True
        )

    def exists(self, name):
        return False  # names are random UUIDs, so a clash is not a practical concern

    def size(self, name):
        return 0  # not tracked; only used by tools that inspect stored files

    def open(self, name, mode="rb"):
        raise NotImplementedError("Cloudinary files are served by URL, not opened locally.")