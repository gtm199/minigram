from django.contrib import admin

from .models import Post


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "short_caption", "created_at")
    search_fields = ("user__username", "caption")
    list_filter = ("created_at",)
    ordering = ("-created_at",)
    raw_id_fields = ("user",)

    @admin.display(description="Caption")
    def short_caption(self, obj):
        return obj.caption[:50]
