from drf_spectacular.utils import extend_schema
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView

from apps.core.responses import success_response

from . import services
from .models import Notification
from .serializers import NotificationSerializer, UnreadCountSerializer


class NotificationListView(ListAPIView):
    """The current user's notifications, newest first."""

    serializer_class = NotificationSerializer
    filter_backends = []

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).select_related(
            "sender", "post"
        )


class MarkAllReadView(APIView):
    @extend_schema(request=None, responses={200: None}, summary="Mark all notifications as read")
    def post(self, request):
        services.mark_all_read(request.user)
        return success_response(message="Notifications marked as read")


class UnreadCountView(APIView):
    @extend_schema(responses={200: UnreadCountSerializer}, summary="Number of unread notifications")
    def get(self, request):
        return success_response({"count": services.unread_count(request.user)})
