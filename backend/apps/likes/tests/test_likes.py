from apps.core.testing import APITestBase, make_user
from apps.likes.models import Like
from apps.notifications.models import Notification
from apps.posts.models import Post


class LikeTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.alice = make_user("alice")
        self.bob = make_user("bob")
        self.post = Post.objects.create(user=self.bob, image="posts/test.png", caption="hi")
        self.url = f"/api/posts/{self.post.id}/like/"

    def test_like_post(self):
        self.login(self.alice)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["data"], {"is_liked": True, "likes_count": 1})

    def test_duplicate_like_is_conflict(self):
        self.login(self.alice)
        self.client.post(self.url)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, 409)
        self.assertFalse(response.json()["success"])
        self.assertEqual(Like.objects.count(), 1)

    def test_unlike_post(self):
        self.login(self.alice)
        self.client.post(self.url)
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"], {"is_liked": False, "likes_count": 0})
        self.assertEqual(Like.objects.count(), 0)

    def test_unlike_without_like_is_404(self):
        self.login(self.alice)
        self.assertEqual(self.client.delete(self.url).status_code, 404)

    def test_like_missing_post_is_404(self):
        self.login(self.alice)
        self.assertEqual(self.client.post("/api/posts/99999/like/").status_code, 404)

    def test_post_detail_reflects_like(self):
        self.login(self.alice)
        self.client.post(self.url)
        data = self.client.get(f"/api/posts/{self.post.id}/").json()["data"]
        self.assertEqual(data["likes_count"], 1)
        self.assertTrue(data["is_liked"])

    def test_like_notifies_author(self):
        self.login(self.alice)
        self.client.post(self.url)
        notification = Notification.objects.get()
        self.assertEqual(notification.recipient, self.bob)
        self.assertEqual(notification.sender, self.alice)
        self.assertEqual(notification.notification_type, Notification.Type.LIKE)
        self.assertEqual(notification.post, self.post)

    def test_liking_own_post_does_not_notify(self):
        self.login(self.bob)
        self.client.post(self.url)
        self.assertEqual(Notification.objects.count(), 0)

    def test_unlike_removes_notification(self):
        self.login(self.alice)
        self.client.post(self.url)
        self.client.delete(self.url)
        self.assertEqual(Notification.objects.count(), 0)

    def test_list_likes(self):
        Like.objects.create(user=self.alice, post=self.post)
        self.login(self.bob)
        response = self.client.get(f"/api/posts/{self.post.id}/likes/")
        self.assertEqual(response.status_code, 200)
        results = response.json()["data"]["results"]
        self.assertEqual([r["user"]["username"] for r in results], ["alice"])
