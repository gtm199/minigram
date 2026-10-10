from django.contrib.auth import get_user_model

from apps.core.testing import PASSWORD, APITestBase, make_user

User = get_user_model()


class AuthTests(APITestBase):
    def register_payload(self, **overrides):
        payload = {
            "username": "gautam",
            "email": "gautam@example.com",
            "password": PASSWORD,
            "password_confirm": PASSWORD,
            "first_name": "Gautam",
            "last_name": "Test",
        }
        payload.update(overrides)
        return payload

    def obtain_tokens(self, user):
        response = self.client.post(
            "/api/auth/login/", {"username": user.username, "password": PASSWORD}, format="json"
        )
        return response.json()["data"]

    def test_register_returns_user_and_tokens(self):
        response = self.client.post("/api/auth/register/", self.register_payload(), format="json")
        self.assertEqual(response.status_code, 201)
        data = response.json()["data"]
        self.assertTrue(response.json()["success"])
        self.assertIn("access", data)
        self.assertIn("refresh", data)
        self.assertEqual(data["user"]["username"], "gautam")
        self.assertNotIn("password", data["user"])

    def test_password_is_hashed(self):
        self.client.post("/api/auth/register/", self.register_payload(), format="json")
        user = User.objects.get(username="gautam")
        self.assertNotEqual(user.password, PASSWORD)
        self.assertTrue(user.check_password(PASSWORD))

    def test_register_duplicate_email_rejected(self):
        make_user("alice", )
        response = self.client.post(
            "/api/auth/register/",
            self.register_payload(username="other", email="ALICE@example.com"),
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json()["success"])
        self.assertIn("email", response.json()["errors"])

    def test_register_password_mismatch(self):
        response = self.client.post(
            "/api/auth/register/", self.register_payload(password_confirm="different"), format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("password_confirm", response.json()["errors"])

    def test_reserved_username_rejected(self):
        response = self.client.post(
            "/api/auth/register/", self.register_payload(username="search"), format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("username", response.json()["errors"])

    def test_login_with_username_and_email(self):
        user = make_user("alice")
        for identifier in (user.username, user.email):
            response = self.client.post(
                "/api/auth/login/", {"username": identifier, "password": PASSWORD}, format="json"
            )
            self.assertEqual(response.status_code, 200)
            self.assertIn("access", response.json()["data"])

    def test_login_invalid_credentials(self):
        make_user("alice")
        response = self.client.post(
            "/api/auth/login/", {"username": "alice", "password": "wrong"}, format="json"
        )
        self.assertEqual(response.status_code, 401)
        self.assertFalse(response.json()["success"])
        self.assertEqual(response.json()["message"], "Invalid username or password")

    def test_jwt_authentication(self):
        user = make_user("alice")
        tokens = self.obtain_tokens(user)

        anonymous = self.client.get("/api/users/me/")
        self.assertEqual(anonymous.status_code, 401)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        response = self.client.get("/api/users/me/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["username"], "alice")

    def test_refresh_token(self):
        tokens = self.obtain_tokens(make_user("alice"))
        response = self.client.post("/api/auth/token/refresh/", {"refresh": tokens["refresh"]}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.json()["data"])

    def test_logout_blacklists_refresh_token(self):
        tokens = self.obtain_tokens(make_user("alice"))
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        logout = self.client.post("/api/auth/logout/", {"refresh": tokens["refresh"]}, format="json")
        self.assertEqual(logout.status_code, 200)

        self.client.credentials()
        refreshed = self.client.post("/api/auth/token/refresh/", {"refresh": tokens["refresh"]}, format="json")
        self.assertEqual(refreshed.status_code, 401)

    def test_edit_profile_and_change_password(self):
        user = self.login(make_user("alice"))
        response = self.client.patch("/api/users/me/", {"bio": "Hello there"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["bio"], "Hello there")

        changed = self.client.post(
            "/api/auth/change-password/",
            {"old_password": PASSWORD, "new_password": "An0ther!Pass#77", "new_password_confirm": "An0ther!Pass#77"},
            format="json",
        )
        self.assertEqual(changed.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.check_password("An0ther!Pass#77"))

    def test_delete_account_requires_password(self):
        user = self.login(make_user("alice"))
        wrong = self.client.delete("/api/users/me/", {"password": "nope"}, format="json")
        self.assertEqual(wrong.status_code, 400)
        ok = self.client.delete("/api/users/me/", {"password": PASSWORD}, format="json")
        self.assertEqual(ok.status_code, 200)
        self.assertFalse(User.objects.filter(pk=user.pk).exists())
