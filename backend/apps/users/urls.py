from django.urls import path

from .profile_views import ProfileView, UserSearchView, UserSuggestionsView
from .views import MeView

urlpatterns = [
    path("me/", MeView.as_view(), name="users-me"),
    path("profile/<str:username>/", ProfileView.as_view(), name="users-profile"),
    path("search/", UserSearchView.as_view(), name="users-search"),
    path("suggestions/", UserSuggestionsView.as_view(), name="users-suggestions"),
]
