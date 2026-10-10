from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.generics import DestroyAPIView, ListCreateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle

from apps.core.responses import success_response
from apps.posts.models import Post

from . import services
from .models import Comment
from .permissions import IsCommentOwner
from .serializers import CommentSerializer


class CommentListCreateView(ListCreateAPIView):
    """List (newest first) or add comments on a post."""

    serializer_class = CommentSerializer
    filter_backends = []

    def get_post(self):
        return get_object_or_404(Post.objects.select_related("user"), pk=self.kwargs["post_id"])

    def get_queryset(self):
        post = self.get_post()
        return Comment.objects.filter(post=post).select_related("user")

    def get_throttles(self):
        throttles = super().get_throttles()
        if self.request.method == "POST":
            self.throttle_scope = "comment_create"
            throttles.append(ScopedRateThrottle())
        return throttles

    @extend_schema(summary="Add a comment", responses={201: CommentSerializer})
    def create(self, request, *args, **kwargs):
        post = self.get_post()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = services.add_comment(request.user, post, serializer.validated_data["text"])
        data = self.get_serializer(comment).data
        return success_response(data, "Comment added successfully", status.HTTP_201_CREATED)


class CommentDestroyView(DestroyAPIView):
    """Delete your own comment."""

    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated, IsCommentOwner]

    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()
        return success_response(message="Comment deleted successfully")
