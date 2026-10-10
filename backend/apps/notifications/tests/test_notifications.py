from apps.core.testing import APITestBase, make_user
from apps.notifications.models import Notification
from apps.posts.models import Post


class NotificationTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.alice = make_user("alice")
        self.bob = make_user("bob")
        self.post = Post.objects.create(user=self.alice, image="posts/test.png")
        Notification.objects.create(
            recipient=self.alice, sender=self.bob, notification_type="LIKE", post=self.post
        )
        Notification.objects.create(
            recipient=self.alice, sender=self.bob, notification_type="FOLLOW"
        )
        Notification.objects.create(
            recipient=self.bob, sender=self.alice, notification_type="FOLLOW"
        )

    def test_list_only_my_notifications(self):
        self.login(self.alice)
        response = self.client.get("/api/notifications/")
        self.assertEqual(response.status_code, 200)
        results = response.json()["data"]["results"]
        self.assertEqual(len(results), 2)
        types = {r["notification_type"] for r in results}
        self.assertEqual(types, {"LIKE", "FOLLOW"})
        like = next(r for r in results if r["notification_type"] == "LIKE")
        self.assertEqual(like["post"]["id"], self.post.id)
        self.assertFalse(like["is_read"])

    def test_unread_count_and_mark_read(self):
        self.login(self.alice)
        self.assertEqual(self.client.get("/api/notifications/unread-count/").json()["data"]["count"], 2)
        self.assertEqual(self.client.post("/api/notifications/mark-read/").status_code, 200)
        self.assertEqual(self.client.get("/api/notifications/unread-count/").json()["data"]["count"], 0)
        # Other users' notifications are untouched.
        self.assertEqual(Notification.objects.filter(recipient=self.bob, is_read=False).count(), 1)

    def test_requires_authentication(self):
        self.assertEqual(self.client.get("/api/notifications/").status_code, 401)
