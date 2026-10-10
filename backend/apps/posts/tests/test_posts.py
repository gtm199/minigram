from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import connection
from django.test.utils import CaptureQueriesContext

from apps.core.testing import APITestBase, make_image, make_user
from apps.follows.models import Follow
from apps.likes.models import Like
from apps.posts.models import Post


def make_post(user, caption="hello"):
    return Post.objects.create(user=user, image="posts/test.png", caption=caption)


class PostTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.alice = make_user("alice")
        self.bob = make_user("bob")

    def create_post(self, user, caption="hello"):
        self.login(user)
        return self.client.post(
            "/api/posts/", {"image": make_image(), "caption": caption}, format="multipart"
        )

    def test_create_post(self):
        response = self.create_post(self.alice)
        self.assertEqual(response.status_code, 201)
        data = response.json()["data"]
        self.assertEqual(data["caption"], "hello")
        self.assertEqual(data["user"]["username"], "alice")
        self.assertEqual(data["likes_count"], 0)
        self.assertFalse(data["is_liked"])
        self.assertTrue(data["image"].startswith("http"))
        self.assertEqual(Post.objects.count(), 1)

    def test_create_requires_authentication(self):
        response = self.client.post("/api/posts/", {"image": make_image()}, format="multipart")
        self.assertEqual(response.status_code, 401)

    def test_create_rejects_fake_image(self):
        self.login(self.alice)
        fake = SimpleUploadedFile("evil.png", b"not really an image", content_type="image/png")
        response = self.client.post("/api/posts/", {"image": fake}, format="multipart")
        self.assertEqual(response.status_code, 400)
        self.assertIn("image", response.json()["errors"])
        self.assertEqual(Post.objects.count(), 0)

    def test_create_rejects_missing_image(self):
        self.login(self.alice)
        response = self.client.post("/api/posts/", {"caption": "no image"}, format="multipart")
        self.assertEqual(response.status_code, 400)

    def test_retrieve_other_users_post(self):
        post = make_post(self.bob)
        self.login(self.alice)
        response = self.client.get(f"/api/posts/{post.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["id"], post.id)

    def test_owner_can_update_caption(self):
        post = make_post(self.alice)
        self.login(self.alice)
        patched = self.client.patch(f"/api/posts/{post.id}/", {"caption": "edited"}, format="json")
        self.assertEqual(patched.status_code, 200)
        self.assertEqual(patched.json()["data"]["caption"], "edited")
        put = self.client.put(f"/api/posts/{post.id}/", {"caption": "replaced"}, format="json")
        self.assertEqual(put.status_code, 200)
        post.refresh_from_db()
        self.assertEqual(post.caption, "replaced")

    def test_owner_can_delete(self):
        post = make_post(self.alice)
        self.login(self.alice)
        response = self.client.delete(f"/api/posts/{post.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Post.objects.filter(pk=post.pk).exists())

    def test_other_user_cannot_modify_or_delete(self):
        post = make_post(self.bob, caption="original")
        self.login(self.alice)
        self.assertEqual(self.client.patch(f"/api/posts/{post.id}/", {"caption": "hacked"}, format="json").status_code, 403)
        self.assertEqual(self.client.put(f"/api/posts/{post.id}/", {"caption": "hacked"}, format="json").status_code, 403)
        self.assertEqual(self.client.delete(f"/api/posts/{post.id}/").status_code, 403)
        post.refresh_from_db()
        self.assertEqual(post.caption, "original")

    def test_missing_post_is_404(self):
        self.login(self.alice)
        self.assertEqual(self.client.get("/api/posts/99999/").status_code, 404)

    def test_filter_by_user(self):
        make_post(self.alice)
        make_post(self.bob)
        self.login(self.alice)
        response = self.client.get("/api/posts/", {"user": "bob"})
        usernames = {item["user"]["username"] for item in response.json()["data"]["results"]}
        self.assertEqual(usernames, {"bob"})

    def test_feed_contains_followed_and_own_posts_only(self):
        carol = make_user("carol")
        Follow.objects.create(follower=self.alice, following=self.bob)
        own, followed, stranger = make_post(self.alice), make_post(self.bob), make_post(carol)

        self.login(self.alice)
        response = self.client.get("/api/posts/feed/")
        ids = {item["id"] for item in response.json()["data"]["results"]}
        self.assertEqual(ids, {own.id, followed.id})
        self.assertNotIn(stranger.id, ids)

        without_own = self.client.get("/api/posts/feed/", {"include_own": "false"})
        self.assertEqual({i["id"] for i in without_own.json()["data"]["results"]}, {followed.id})

    def test_feed_is_paginated_in_envelope(self):
        Follow.objects.create(follower=self.alice, following=self.bob)
        for _ in range(25):
            make_post(self.bob)
        self.login(self.alice)
        response = self.client.get("/api/posts/feed/")
        data = response.json()["data"]
        self.assertTrue(response.json()["success"])
        self.assertEqual(data["count"], 25)
        self.assertEqual(len(data["results"]), 20)
        self.assertIsNotNone(data["next"])
        second = self.client.get("/api/posts/feed/", {"page": 2})
        self.assertEqual(len(second.json()["data"]["results"]), 5)

    def test_feed_query_count_does_not_grow_with_posts(self):
        Follow.objects.create(follower=self.alice, following=self.bob)
        self.login(self.alice)
        make_post(self.bob)

        with CaptureQueriesContext(connection) as few:
            self.client.get("/api/posts/feed/")
        for _ in range(10):
            make_post(self.bob)
        with CaptureQueriesContext(connection) as many:
            self.client.get("/api/posts/feed/")
        self.assertEqual(len(few), len(many))  # no N+1

    def test_explore_excludes_own_and_sorts_by_popularity(self):
        carol = make_user("carol")
        mine = make_post(self.alice)
        quiet = make_post(self.bob, "quiet")
        popular = make_post(self.bob, "popular")
        Like.objects.create(user=carol, post=popular)

        self.login(self.alice)
        recent = self.client.get("/api/posts/explore/", {"sort": "recent"}).json()["data"]["results"]
        self.assertNotIn(mine.id, [p["id"] for p in recent])
        self.assertEqual([p["id"] for p in recent], [popular.id, quiet.id])  # newest first

        ranked = self.client.get("/api/posts/explore/", {"sort": "popular"}).json()["data"]["results"]
        self.assertEqual(ranked[0]["id"], popular.id)

    def test_explore_rejects_unknown_sort(self):
        self.login(self.alice)
        self.assertEqual(self.client.get("/api/posts/explore/", {"sort": "weird"}).status_code, 400)
