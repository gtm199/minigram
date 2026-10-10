from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Value, BooleanField
from django.shortcuts import get_object_or_404
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView

from apps.core.responses import success_response
from apps.follows.services import annotate_is_following

from .serializers import ProfileSerializer, UserMiniSerializer

User = get_user_model()

SUGGESTION_LIMIT = 10


class ProfileView(APIView):
    """GET /api/users/profile/<username>/"""

    serializer_class = ProfileSerializer

    def get(self, request, username):
        user = get_object_or_404(User, username__iexact=username, is_active=True)
        data = ProfileSerializer(user, context={"request": request}).data
        return success_response(data)


class UserSearchView(ListAPIView):
    """GET /api/users/search/?q= — matches username, first name and last name.

    Every word of the query must match at least one of the three fields.
    """

    serializer_class = UserMiniSerializer
    filter_backends = []

    def get_queryset(self):
        query = self.request.query_params.get("q", "").strip()
        if not query:
            return User.objects.none()
        queryset = User.objects.filter(is_active=True).exclude(pk=self.request.user.pk)
        for term in query.split():
            queryset = queryset.filter(
                Q(username__icontains=term)
                | Q(first_name__icontains=term)
                | Q(last_name__icontains=term)
            )
        return annotate_is_following(queryset, self.request.user).order_by("username")


class UserSuggestionsView(APIView):
    """GET /api/users/suggestions/ — popular users you don't follow yet (not paginated)."""

    serializer_class = UserMiniSerializer

    def get(self, request):
        users = (
            User.objects.filter(is_active=True)
            .exclude(pk=request.user.pk)
            .exclude(follower_relations__follower=request.user)
            .annotate(
                follower_total=Count("follower_relations", distinct=True),
                is_following=Value(False, output_field=BooleanField()),
            )
            .order_by("-follower_total", "-date_joined")[:SUGGESTION_LIMIT]
        )
        data = UserMiniSerializer(users, many=True, context={"request": request}).data
        return success_response(data)
