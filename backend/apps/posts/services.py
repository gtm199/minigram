from django.db.models import Count, Exists, F, IntegerField, OuterRef, Q, Subquery
from django.db.models.functions import Coalesce

from apps.comments.models import Comment
from apps.follows.models import Follow
from apps.likes.models import Like


def _count_per_post(model):
    return Coalesce(
        Subquery(
            model.objects.filter(post=OuterRef("pk"))
            .order_by()
            .values("post")
            .annotate(total=Count("pk"))
            .values("total"),
            output_field=IntegerField(),
        ),
        0,
        output_field=IntegerField(),
    )


def annotate_posts(queryset, user):
    """Add likes_count, comments_count and is_liked in a single query (no N+1)."""
    return queryset.annotate(
        likes_count=_count_per_post(Like),
        comments_count=_count_per_post(Comment),
        is_liked=Exists(Like.objects.filter(post=OuterRef("pk"), user=user)),
    )


def feed_posts(queryset, user, include_own=True):
    """Posts from people `user` follows, optionally plus their own."""
    following_ids = Follow.objects.filter(follower=user).values("following_id")
    condition = Q(user_id__in=following_ids)
    if include_own:
        condition |= Q(user=user)
    return queryset.filter(condition)


def explore_posts(queryset, user, sort):
    """Other people's posts; 'popular' ranks by likes + comments."""
    queryset = queryset.exclude(user=user)
    if sort == "popular":
        return queryset.annotate(popularity=F("likes_count") + F("comments_count")).order_by(
            "-popularity", "-created_at", "-id"
        )
    return queryset.order_by("-created_at", "-id")
