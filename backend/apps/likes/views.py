from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView

from apps.core.exceptions import ConflictError
from apps.core.responses import success_response
from apps.posts.models import Post

from . import services
from .models import Like
from .serializers import LikeSerializer, LikeStateSerializer


class PostLikeView(APIView):
    @extend_schema(
        request=None,
        responses={201: LikeStateSerializer},
        summary="Like a post",
        description="409 if you already liked it, 404 if the post does not exist.",
    )
    def post(self, request, post_id):
        post = get_object_or_404(Post, pk=post_id)
        if not services.like_post(request.user, post):
            raise ConflictError("You already liked this post.")
        return success_response(
            services.like_state(request.user, post), "Post liked", status.HTTP_201_CREATED
        )

    @extend_schema(
        responses={200: LikeStateSerializer},
        summary="Unlike a post",
        description="404 if you had not liked it.",
    )
    def delete(self, request, post_id):
        post = get_object_or_404(Post, pk=post_id)
        if not services.unlike_post(request.user, post):
            raise NotFound("You have not liked this post.")
        return success_response(services.like_state(request.user, post), "Like removed")


class PostLikesListView(ListAPIView):
    """Who liked a post, newest first."""

    serializer_class = LikeSerializer
    filter_backends = []

    def get_queryset(self):
        post = get_object_or_404(Post, pk=self.kwargs["post_id"])
        return Like.objects.filter(post=post).select_related("user")
