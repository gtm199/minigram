FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    DJANGO_SETTINGS_MODULE=config.settings.production

WORKDIR /app

# Dependencies first so Docker caches this layer until requirements change.
COPY requirements/ requirements/
RUN pip install -r requirements/production.txt

COPY . .

# Render injects $PORT (default 10000). On every start: apply migrations, collect static files,
# optionally create an admin from DJANGO_SUPERUSER_* env vars (ignored if unset or already exists),
# then serve with gunicorn.
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && (python manage.py createsuperuser --noinput >/dev/null 2>&1 || true) && exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-10000} --workers ${WEB_CONCURRENCY:-2} --timeout 180 --access-logfile -"]
