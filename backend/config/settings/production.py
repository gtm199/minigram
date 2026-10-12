import os

from .base import *  # noqa: F401,F403
from .base import MIDDLEWARE, env

DEBUG = False

# Render sets RENDER_EXTERNAL_HOSTNAME automatically; add custom domains via ALLOWED_HOSTS.
_render_host = os.environ.get("RENDER_EXTERNAL_HOSTNAME")
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=[]) + ([_render_host] if _render_host else [])
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[]) + (
    [f"https://{_render_host}"] if _render_host else []
)

# The platform's health checker may call over plain HTTP; do not redirect it.
SECURE_REDIRECT_EXEMPT = [r"^healthz/?$"]

# Serve uploaded images from Django (fine for a small app; use S3/Cloudinary to scale).
SERVE_MEDIA_FROM_DJANGO = env.bool("SERVE_MEDIA_FROM_DJANGO", default=not USE_CLOUDINARY)

SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=True)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")

STORAGES = {
    "default": STORAGES["default"],  # Cloudinary when configured, otherwise local disk
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}