# MiniGram

- `backend/`: Django + DRF + PostgreSQL + JWT: auth, profiles, posts, feed, explore, likes, comments, follows, search, notifications, Swagger docs and tests.
- `mobile/`: Expo + React Native + TypeScript app (all screens written). See `mobile/README.md` and `mobile/API_CONTRACT.md`.

## Project structure

```text
backend/apps/
├── core/           shared helpers, no models (nothing to migrate, not in INSTALLED_APPS)
│   ├── exceptions.py   error envelope + ConflictError (409)
│   ├── renderers.py    wraps every success response in {success, message, data}
│   ├── responses.py    success_response() helper
│   ├── validators.py   image size / type / dimension checks
│   ├── uploads.py      random, whitelisted upload filenames
│   └── testing.py      helpers used by the test suites
├── users/          custom User, auth, profile, search, suggestions   (has models)
├── follows/        follow / unfollow, followers, following           (has models)
├── posts/          posts, feed, explore                              (has models)
├── likes/          like / unlike                                     (has models)
├── comments/       comments                                          (has models)
└── notifications/  like / comment / follow notifications             (has models)
```

`makemigrations` only needs the apps that have models, which is why `core` is not in that command.

## Backend setup (Windows PowerShell), from this folder

```powershell
cd backend
Copy-Item .env.example .env        # then edit .env with your real values
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements\development.txt
```

Create the database:

```powershell
psql -U postgres
```
```sql
CREATE USER minigram_user WITH PASSWORD 'your-password';
CREATE DATABASE minigram_db OWNER minigram_user;
\q
```

```powershell
python manage.py makemigrations users follows posts likes comments notifications
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000
```

Swagger UI: http://localhost:8000/api/docs/

Hosting on Render: see `DEPLOY.md` (Dockerfile in `backend/`, blueprint in `render.yaml`).

If you already ran Stage 2 migrations, the same commands still work; Django only adds the new apps.

## Run the backend tests

Django creates a temporary `test_minigram_db`, so the database user needs permission to create databases (once):

```sql
ALTER USER minigram_user CREATEDB;
```

```powershell
python manage.py test apps
```

## Try the API from PowerShell

```powershell
$login = Invoke-RestMethod -Method Post -Uri http://localhost:8000/api/auth/login/ -ContentType "application/json" -Body (@{username="gautam"; password="YourPassword"} | ConvertTo-Json)
$h = @{ Authorization = "Bearer $($login.data.access)" }
Invoke-RestMethod -Uri http://localhost:8000/api/posts/feed/ -Headers $h
Invoke-RestMethod -Uri "http://localhost:8000/api/users/search/?q=gautam" -Headers $h
```
