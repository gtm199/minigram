import django_filters

from .models import Post


class PostFilter(django_filters.FilterSet):
    user = django_filters.CharFilter(field_name="user__username", lookup_expr="iexact")

    class Meta:
        model = Post
        fields = ["user"]
