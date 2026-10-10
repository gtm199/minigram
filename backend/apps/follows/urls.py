from django.urls import path

from .views import FollowersListView, FollowingListView, FollowView

urlpatterns = [
    path("<str:username>/follow/", FollowView.as_view(), name="user-follow"),
    path("<str:username>/followers/", FollowersListView.as_view(), name="user-followers"),
    path("<str:username>/following/", FollowingListView.as_view(), name="user-following"),
]
