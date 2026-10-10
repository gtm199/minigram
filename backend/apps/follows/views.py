from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView

from apps.core.exceptions import ConflictError
from apps.core.responses import success_response
from apps.users.serializers import UserMiniSerializer

from . import services
from .serializers import FollowStateSerializer

User = get_user_model()


def get_target_user(username):
    return get_object_or_404(User, username__iexact=username, is_active=True)


class FollowView(APIView):
    @extend_schema(
        request=None,
        responses={201: FollowStateSerializer},
        summary="Follow a user",
        description="409 if already following, 400 if you try to follow yourself, 404 if the user does not exist.",
    )
    def post(self, request, username):
        target = get_target_user(username)
        if not services.follow(request.user, target):
            raise ConflictError("You are already following this user.")
        data = {"is_following": True, "followers_count": services.followers_count(target)}
        return success_response(data, "User followed", status.HTTP_201_CREATED)

    @extend_schema(
        responses={200: FollowStateSerializer},
        summary="Unfollow a user",
        description="404 if you are not following this user.",
    )
    def delete(self, request, username):
        target = get_target_user(username)
        if not services.unfollow(request.user, target):
            raise NotFound("You are not following this user.")
        data = {"is_following": False, "followers_count": services.followers_count(target)}
        return success_response(data, "User unfollowed")


class FollowersListView(ListAPIView):
    """Users who follow <username>."""

    serializer_class = UserMiniSerializer
    filter_backends = []

    def get_queryset(self):
        target = get_target_user(self.kwargs["username"])
        queryset = User.objects.filter(is_active=True, following_relations__following=target)
        return services.annotate_is_following(queryset, self.request.user).order_by("username")


class FollowingListView(ListAPIView):
    """Users that <username> follows."""

    serializer_class = UserMiniSerializer
    filter_backends = []

    def get_queryset(self):
        target = get_target_user(self.kwargs["username"])
        queryset = User.objects.filter(is_active=True, follower_relations__follower=target)
        return services.annotate_is_following(queryset, self.request.user).order_by("username")
