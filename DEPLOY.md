# Deploying the backend on Render

## 1. Create and commit migrations first (required)

The repo ships without migration files. Generate them locally and commit them, otherwise the
deployed database will have no tables for your apps:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py makemigrations users follows posts likes comments notifications
git add apps/*/migrations
```

## 2. Push to GitHub, then deploy

Push the `minigram` folder as the repo root (it contains `render.yaml`, `backend/`, `mobile/`).
In Render: **New > Blueprint**, pick the repo, and apply. Render builds `backend/Dockerfile`,
creates the Postgres database and wires `DATABASE_URL`, `SECRET_KEY` and `JWT_SIGNING_KEY`.

Test: `https://<your-service>.onrender.com/healthz/` returns `ok`, and `/api/docs/` shows Swagger.

## 3. Create an admin (optional)

Add `DJANGO_SUPERUSER_USERNAME`, `DJANGO_SUPERUSER_EMAIL` and `DJANGO_SUPERUSER_PASSWORD` in the
service's Environment tab. The container creates the admin on the next start (and silently skips it afterwards).
Remove the password variable once it exists.

## 4. Point the mobile app at it

In `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=https://<your-service>.onrender.com/api
```

Restart with `npx expo start -c`. HTTPS means no cleartext-traffic problems on Android.

## Things to know

- **Free web services sleep** after idle time; the first request can take about a minute. The app's
  15 s request timeout (`REQUEST_TIMEOUT_MS` in `mobile/utils/constants.ts`) will show "Network error" on that
  first call: retry, raise the timeout, or use a paid instance.
- **Uploads** are stored on the persistent disk at `/var/data/media`. Without a disk they are lost on each deploy.
  For anything beyond a demo, move media to S3/Cloudinary.
- **Custom domain:** add it to the `ALLOWED_HOSTS` environment variable (comma-separated).

## Run the image locally

`DB_HOST=host.docker.internal` lets the container reach PostgreSQL running on your Windows PC (`localhost` inside a container is the container itself).

```powershell
cd backend
docker build -t minigram-api .
docker run --rm -p 10000:10000 --env-file .env -e DJANGO_SETTINGS_MODULE=config.settings.production -e SECURE_SSL_REDIRECT=False -e ALLOWED_HOSTS=localhost,127.0.0.1 -e DB_HOST=host.docker.internal minigram-api
```
