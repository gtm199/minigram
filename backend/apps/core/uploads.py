import uuid
from pathlib import Path

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def build_upload_path(folder, filename):
    """Never trust the client's filename: use a random name, keep only a whitelisted extension."""
    extension = Path(filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        extension = ".jpg"
    return f"{folder}/{uuid.uuid4().hex}{extension}"


ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".m4v"}


def build_video_upload_path(folder, filename):
    extension = Path(filename).suffix.lower()
    if extension not in ALLOWED_VIDEO_EXTENSIONS:
        extension = ".mp4"
    return f"{folder}/{uuid.uuid4().hex}{extension}"