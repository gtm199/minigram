from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.viewsets import ModelViewSet

from apps.core.responses import success_response

from . import services
from .filters import PostFilter
from .models import Post
from .permissions import IsOwnerOrReadOnly
from .serializers import PostCreateSerializer, PostSerializer, PostUpdateSerializer

SORT_CHOICES = ("recent", "popular")


@extend_schema_view(
    list=extend_schema(summary="List posts", description="Filter with `?user=<username>`."),
    create=extend_schema(
        request={"multipart/form-data": PostCreateSerializer},
        responses={201: PostSerializer},
        summary="Create a post",
    ),
    partial_update=extend_schema(request=PostUpdateSerializer, responses=PostSerializer),
    update=extend_schema(request=PostUpdateSerializer, responses=PostSerializer),
)
class PostViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_class = PostFilter
    lookup_value_regex = r"\d+"
    http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]

    def get_queryset(self):
        queryset = Post.objects.select_related("user")
        return services.annotate_posts(queryset, self.request.user).order_by("-created_at", "-id")

    def get_serializer_class(self):
        if self.action == "create":
            return PostCreateSerializer
        if self.action in ("update", "partial_update"):
            return PostUpdateSerializer
        return PostSerializer

    def get_throttles(self):
        throttles = super().get_throttles()
        if self.action == "create":
            self.throttle_scope = "post_create"
            throttles.append(ScopedRateThrottle())
        return throttles

    def _representation(self, post):
        """Re-read through the annotated queryset so counts/is_liked are present."""
        annotated = self.get_queryset().get(pk=post.pk)
        return PostSerializer(annotated, context=self.get_serializer_context()).data

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = serializer.save(user=request.user)
        return success_response(
            self._representation(post), "Post created successfully", status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        post = self.get_object()  # object permission: only the owner passes
        serializer = self.get_serializer(post, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(self._representation(post), "Post updated successfully")

    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()
        return success_response(message="Post deleted successfully")

    def _paginated(self, queryset):
        page = self.paginate_queryset(queryset)
        serializer = PostSerializer(page, many=True, context=self.get_serializer_context())
        return self.get_paginated_response(serializer.data)

    @extend_schema(
        responses=PostSerializer(many=True),
        parameters=[
            OpenApiParameter("include_own", bool, description="Include your own posts (default true).")
        ],
        summary="Home feed: posts from people you follow",
    )
    @action(detail=False, methods=["get"])
    def feed(self, request):
        include_own = request.query_params.get("include_own", "true").lower() != "false"
        queryset = services.feed_posts(self.get_queryset(), request.user, include_own)
        return self._paginated(queryset)

    @extend_schema(
        responses=PostSerializer(many=True),
        parameters=[OpenApiParameter("sort", str, enum=list(SORT_CHOICES), description="recent (default) or popular")],
        summary="Explore: other people's posts, recent or popular (likes + comments)",
    )
    @action(detail=False, methods=["get"])
    def explore(self, request):
        sort = request.query_params.get("sort", "recent")
        if sort not in SORT_CHOICES:
            raise ValidationError({"sort": f"Must be one of: {', '.join(SORT_CHOICES)}."})
        queryset = services.explore_posts(self.get_queryset(), request.user, sort)
        return self._paginated(queryset)
