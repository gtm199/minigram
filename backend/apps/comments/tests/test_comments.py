from apps.comments.models import Comment
from apps.core.testing import APITestBase, make_user
from apps.notifications.models import Notification
from apps.posts.models import Post


class CommentTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.alice = make_user("alice")
        self.bob = make_user("bob")
        self.post = Post.objects.create(user=self.bob, image="posts/test.png")
        self.url = f"/api/posts/{self.post.id}/comments/"

    def test_create_comment(self):
        self.login(self.alice)
        response = self.client.post(self.url, {"text": "Nice shot!"}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["data"]["text"], "Nice shot!")
        self.assertEqual(response.json()["data"]["user"]["username"], "alice")
        self.assertEqual(Comment.objects.count(), 1)

    def test_blank_comment_rejected(self):
        self.login(self.alice)
        response = self.client.post(self.url, {"text": "   "}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("text", response.json()["errors"])

    def test_comment_on_missing_post_is_404(self):
        self.login(self.alice)
        self.assertEqual(self.client.post("/api/posts/99999/comments/", {"text": "x"}, format="json").status_code, 404)

    def test_list_comments_newest_first(self):
        first = Comment.objects.create(user=self.alice, post=self.post, text="first")
        second = Comment.objects.create(user=self.bob, post=self.post, text="second")
        self.login(self.alice)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        ids = [c["id"] for c in response.json()["data"]["results"]]
        self.assertEqual(ids, [second.id, first.id])

    def test_comment_count_on_post(self):
        Comment.objects.create(user=self.alice, post=self.post, text="a")
        Comment.objects.create(user=self.bob, post=self.post, text="b")
        self.login(self.alice)
        data = self.client.get(f"/api/posts/{self.post.id}/").json()["data"]
        self.assertEqual(data["comments_count"], 2)

    def test_comment_notifies_post_author(self):
        self.login(self.alice)
        self.client.post(self.url, {"text": "hello"}, format="json")
        notification = Notification.objects.get()
        self.assertEqual(notification.recipient, self.bob)
        self.assertEqual(notification.notification_type, Notification.Type.COMMENT)

    def test_owner_can_delete_comment(self):
        comment = Comment.objects.create(user=self.alice, post=self.post, text="mine")
        self.login(self.alice)
        response = self.client.delete(f"/api/comments/{comment.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Comment.objects.filter(pk=comment.pk).exists())

    def test_cannot_delete_someone_elses_comment(self):
        comment = Comment.objects.create(user=self.bob, post=self.post, text="bobs")
        self.login(self.alice)
        response = self.client.delete(f"/api/comments/{comment.id}/")
        self.assertEqual(response.status_code, 403)
        self.assertTrue(Comment.objects.filter(pk=comment.pk).exists())
