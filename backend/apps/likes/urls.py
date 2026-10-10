from django.urls import path

from .views import PostLikesListView, PostLikeView

urlpatterns = [
    path("posts/<int:post_id>/like/", PostLikeView.as_view(), name="post-like"),
    path("posts/<int:post_id>/likes/", PostLikesListView.as_view(), name="post-likes"),
]
