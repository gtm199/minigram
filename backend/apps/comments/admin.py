from django.contrib import admin

from .models import Comment


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "post", "short_text", "created_at")
    search_fields = ("user__username", "text")
    list_filter = ("created_at",)
    ordering = ("-created_at",)
    raw_id_fields = ("user", "post")

    @admin.display(description="Text")
    def short_text(self, obj):
        return obj.text[:50]
