from django.db import IntegrityError, transaction

from apps.core.testing import APITestBase, make_user
from apps.follows.models import Follow
from apps.notifications.models import Notification
from apps.posts.models import Post


class FollowTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.alice = make_user("alice")
        self.bob = make_user("bob")

    def test_follow_and_counts(self):
        self.login(self.alice)
        response = self.client.post("/api/users/bob/follow/")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["data"], {"is_following": True, "followers_count": 1})

        profile = self.client.get("/api/users/profile/bob/").json()["data"]
        self.assertEqual(profile["followers_count"], 1)
        self.assertTrue(profile["is_following"])
        self.assertFalse(profile["is_me"])

        mine = self.client.get("/api/users/profile/alice/").json()["data"]
        self.assertEqual(mine["following_count"], 1)
        self.assertTrue(mine["is_me"])

    def test_duplicate_follow_is_conflict(self):
        self.login(self.alice)
        self.client.post("/api/users/bob/follow/")
        response = self.client.post("/api/users/bob/follow/")
        self.assertEqual(response.status_code, 409)
        self.assertEqual(Follow.objects.count(), 1)

    def test_cannot_follow_yourself(self):
        self.login(self.alice)
        response = self.client.post("/api/users/alice/follow/")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Follow.objects.count(), 0)

    def test_database_blocks_self_follow(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            Follow.objects.create(follower=self.alice, following=self.alice)

    def test_database_blocks_duplicate_follow(self):
        Follow.objects.create(follower=self.alice, following=self.bob)
        with self.assertRaises(IntegrityError), transaction.atomic():
            Follow.objects.create(follower=self.alice, following=self.bob)

    def test_follow_unknown_user_is_404(self):
        self.login(self.alice)
        self.assertEqual(self.client.post("/api/users/nobody/follow/").status_code, 404)

    def test_unfollow(self):
        Follow.objects.create(follower=self.alice, following=self.bob)
        self.login(self.alice)
        response = self.client.delete("/api/users/bob/follow/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"], {"is_following": False, "followers_count": 0})

    def test_unfollow_when_not_following_is_404(self):
        self.login(self.alice)
        self.assertEqual(self.client.delete("/api/users/bob/follow/").status_code, 404)

    def test_followers_and_following_lists(self):
        carol = make_user("carol")
        Follow.objects.create(follower=self.alice, following=self.bob)
        Follow.objects.create(follower=carol, following=self.bob)
        Follow.objects.create(follower=self.bob, following=carol)

        self.login(self.alice)
        followers = self.client.get("/api/users/bob/followers/").json()["data"]["results"]
        self.assertEqual([u["username"] for u in followers], ["alice", "carol"])
        self.assertEqual(
            {u["username"]: u["is_following"] for u in followers}, {"alice": False, "carol": False}
        )
        following = self.client.get("/api/users/bob/following/").json()["data"]["results"]
        self.assertEqual([u["username"] for u in following], ["carol"])

    def test_follow_creates_notification_and_unfollow_removes_it(self):
        self.login(self.alice)
        self.client.post("/api/users/bob/follow/")
        notification = Notification.objects.get()
        self.assertEqual(notification.recipient, self.bob)
        self.assertEqual(notification.notification_type, Notification.Type.FOLLOW)
        self.client.delete("/api/users/bob/follow/")
        self.assertEqual(Notification.objects.count(), 0)

    def test_search_matches_username_and_names(self):
        gautam = make_user("gautam", first_name="Gautam", last_name="Kumar")
        make_user("zed", first_name="Zed", last_name="Gautamson")
        Follow.objects.create(follower=self.alice, following=gautam)
        self.login(self.alice)
        results = self.client.get("/api/users/search/", {"q": "gautam"}).json()["data"]["results"]
        self.assertEqual({u["username"] for u in results}, {"gautam", "zed"})
        flags = {u["username"]: u["is_following"] for u in results}
        self.assertTrue(flags["gautam"])
        self.assertFalse(flags["zed"])

    def test_search_empty_query_returns_nothing_and_excludes_self(self):
        self.login(self.alice)
        self.assertEqual(self.client.get("/api/users/search/").json()["data"]["count"], 0)
        results = self.client.get("/api/users/search/", {"q": "alice"}).json()["data"]["results"]
        self.assertEqual(results, [])

    def test_suggestions_exclude_self_and_followed(self):
        carol = make_user("carol")
        Follow.objects.create(follower=self.alice, following=self.bob)
        self.login(self.alice)
        usernames = [u["username"] for u in self.client.get("/api/users/suggestions/").json()["data"]]
        self.assertEqual(usernames, ["carol"])

    def test_profile_posts_count(self):
        Post.objects.create(user=self.bob, image="posts/a.png")
        self.login(self.alice)
        self.assertEqual(self.client.get("/api/users/profile/bob/").json()["data"]["posts_count"], 1)

