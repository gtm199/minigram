from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

# These would collide with fixed routes such as /api/users/me/ or /api/users/search/.
RESERVED_USERNAMES = {"me", "profile", "search", "suggestions"}


class UniqueIdentityMixin:
    """Case-insensitive uniqueness for username and email."""

    def _check_unique(self, field, value):
        queryset = User.objects.filter(**{f"{field}__iexact": value})
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError(f"A user with this {field} already exists.")

    def validate_username(self, value):
        if value.lower() in RESERVED_USERNAMES:
            raise serializers.ValidationError("This username is reserved.")
        self._check_unique("username", value)
        return value

    def validate_email(self, value):
        value = value.lower()
        self._check_unique("email", value)
        return value


class UserSerializer(serializers.ModelSerializer):
    """Full read-only representation of the authenticated user."""

    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "bio",
            "profile_picture",
            "date_joined",
        )
        read_only_fields = fields


class RegisterSerializer(UniqueIdentityMixin, serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={"input_type": "password"})
    password_confirm = serializers.CharField(write_only=True, style={"input_type": "password"})

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
        )

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        candidate = User(
            username=attrs.get("username"),
            email=attrs.get("email"),
            first_name=attrs.get("first_name", ""),
            last_name=attrs.get("last_name", ""),
        )
        try:
            validate_password(attrs["password"], user=candidate)
        except Exception as exc:  # DjangoValidationError
            raise serializers.ValidationError({"password": list(exc.messages)})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        return User.objects.create_user(**validated_data)


class UserUpdateSerializer(UniqueIdentityMixin, serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "first_name",
            "last_name",
            "bio",
            "profile_picture",
        )


class LoginSerializer(TokenObtainPairSerializer):
    """Accepts username or email, returns tokens plus the user."""

    def validate(self, attrs):
        identifier = attrs.get("username", "")
        if "@" in identifier:
            match = User.objects.filter(email__iexact=identifier).first()
            if match:
                attrs["username"] = match.username
        try:
            data = super().validate(attrs)
        except AuthenticationFailed:
            raise AuthenticationFailed("Invalid username or password")
        data["user"] = UserSerializer(self.user, context=self.context).data
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate_old_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "Passwords do not match."}
            )
        try:
            validate_password(attrs["new_password"], user=self.context["request"].user)
        except Exception as exc:  # DjangoValidationError
            raise serializers.ValidationError({"new_password": list(exc.messages)})
        return attrs


class DeleteAccountSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)

    def validate_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Password is incorrect.")
        return value


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class AuthorSerializer(serializers.ModelSerializer):
    """Minimal user embedded in posts, comments, likes and notifications."""

    class Meta:
        model = User
        fields = ("id", "username", "profile_picture")
        read_only_fields = fields


class UserMiniSerializer(serializers.ModelSerializer):
    """User row for search, suggestions and follower lists.

    `is_following` comes from a queryset annotation (see follows.services.annotate_is_following).
    """

    full_name = serializers.CharField(read_only=True)
    is_following = serializers.BooleanField(read_only=True, default=False)

    class Meta:
        model = User
        fields = ("id", "username", "full_name", "profile_picture", "is_following")
        read_only_fields = fields


class ProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    posts_count = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    is_me = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "bio",
            "profile_picture",
            "posts_count",
            "followers_count",
            "following_count",
            "is_following",
            "is_me",
        )
        read_only_fields = fields

    def get_posts_count(self, obj) -> int:
        return obj.posts.count()

    def get_followers_count(self, obj) -> int:
        return obj.follower_relations.count()

    def get_following_count(self, obj) -> int:
        return obj.following_relations.count()

    def get_is_following(self, obj) -> bool:
        viewer = self.context["request"].user
        return obj.pk != viewer.pk and obj.follower_relations.filter(follower=viewer).exists()

    def get_is_me(self, obj) -> bool:
        return obj.pk == self.context["request"].user.pk
