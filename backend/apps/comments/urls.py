from django.urls import path

from .views import CommentDestroyView, CommentListCreateView

urlpatterns = [
    path("posts/<int:post_id>/comments/", CommentListCreateView.as_view(), name="post-comments"),
    path("comments/<int:pk>/", CommentDestroyView.as_view(), name="comment-detail"),
]
