# API contract the mobile app expects

All responses use the envelope `{ "success", "message", "data" }` (errors: `{ "success": false, "message", "errors" }`).
List endpoints return `data = { count, next, previous, results }` (DRF page-number pagination, `?page=N`, 20 per page).
Image URLs must be absolute (serializers need `context={"request": request}`).

| Method | Path | `data` |
|---|---|---|
| POST | /auth/register/, /auth/login/ | `{ user, access, refresh }` |
| POST | /auth/token/refresh/ | `{ access, refresh }` |
| POST | /auth/logout/ | `{}` |
| POST | /auth/change-password/ | `{ access, refresh }` |
| GET/PATCH/DELETE | /users/me/ | User (DELETE body: `{password}`) |
| GET | /users/profile/<username>/ | Profile: id, username, first_name, last_name, full_name, bio, profile_picture, posts_count, followers_count, following_count, is_following, is_me |
| GET | /users/search/?q= | page of UserMini: id, username, full_name, profile_picture, is_following |
| GET | /users/suggestions/ | list (not paged) of UserMini |
| POST/DELETE | /users/<username>/follow/ | `{ is_following, followers_count }` |
| GET | /users/<username>/followers/, /following/ | page of UserMini |
| GET | /posts/feed/ | page of Post (followed users + own) |
| GET | /posts/explore/?sort=recent\|popular | page of Post (popular = likes + comments) |
| GET | /posts/?user=<username> | page of Post |
| POST | /posts/ (multipart: image, caption) | Post |
| GET/PATCH/DELETE | /posts/<id>/ | Post (PATCH JSON `{caption}`) |
| POST/DELETE | /posts/<id>/like/ | `{ is_liked, likes_count }` |
| GET/POST | /posts/<id>/comments/ | page of Comment (newest first) / created Comment (body `{text}`) |
| DELETE | /comments/<id>/ | `{}` |
| GET | /notifications/ | page of Notification |
| POST | /notifications/mark-read/ | `{}` |
| GET | /notifications/unread-count/ | `{ count }` |

Post: id, user{id,username,profile_picture}, image, caption, likes_count, comments_count, is_liked, created_at, updated_at.
Comment: id, user{...}, post, text, created_at.
Notification: id, sender{...}, notification_type (LIKE|COMMENT|FOLLOW), post{id,image}|null, is_read, created_at.
