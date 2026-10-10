from django.conf import settings
from django.core.exceptions import ValidationError
from PIL import Image, UnidentifiedImageError

ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


def validate_image_upload(file):
    """Validate size, declared type, real image format (via Pillow) and dimensions."""
    max_mb = settings.MAX_IMAGE_SIZE_MB
    if file.size > max_mb * 1024 * 1024:
        raise ValidationError(f"Image must be smaller than {max_mb} MB.")

    content_type = getattr(file, "content_type", None)
    if content_type and content_type not in ALLOWED_CONTENT_TYPES:
        raise ValidationError("Only JPEG, PNG and WebP images are allowed.")

    try:
        with Image.open(file) as image:
            image_format = image.format
            width, height = image.size
            image.verify()
    except (UnidentifiedImageError, OSError, SyntaxError, Image.DecompressionBombError):
        raise ValidationError("Upload a valid image file.")
    finally:
        file.seek(0)

    if image_format not in ALLOWED_IMAGE_FORMATS:
        raise ValidationError("Only JPEG, PNG and WebP images are allowed.")

    if min(width, height) < settings.MIN_IMAGE_DIMENSION:
        raise ValidationError(
            f"Image must be at least {settings.MIN_IMAGE_DIMENSION}px on each side."
        )
    if max(width, height) > settings.MAX_IMAGE_DIMENSION:
        raise ValidationError(
            f"Image must be at most {settings.MAX_IMAGE_DIMENSION}px on each side."
        )
