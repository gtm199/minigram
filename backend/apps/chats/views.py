# backend/apps/chats/views.py
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.generics import ListCreateAPIView
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.core.responses import success_response

from . import services
from .models import Message
from .serializers import ConversationSerializer, MessageSerializer, StartConversationSerializer

User = get_user_model()


class ConversationListCreateView(ListCreateAPIView):
    """List my conversations (latest first), or start/open one with POST {username}."""

    serializer_class = ConversationSerializer
    filter_backends = []

    def get_queryset(self):
        user = self.request.user
        queryset = services.annotate_conversations(services.conversations_for(user), user)
        return queryset.order_by("-last_message_at", "-id")

    @extend_schema(
        request=StartConversationSerializer,
        responses={201: ConversationSerializer},
        summary="Start (or open) a conversation with a user",
    )
    def create(self, request, *args, **kwargs):
        serializer = StartConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        other = get_object_or_404(
            User, username__iexact=serializer.validated_data["username"], is_active=True
        )
        conversation, created = services.get_or_create_conversation(request.user, other)
        annotated = self.get_queryset().get(pk=conversation.pk)
        data = ConversationSerializer(annotated, context=self.get_serializer_context()).data
        return success_response(
            data,
            "Conversation ready",
            status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class MessageListCreateView(ListCreateAPIView):
    """Messages newest first. `?after=<id>` returns only newer messages (used for polling)."""

    serializer_class = MessageSerializer
    filter_backends = []

    def get_conversation(self):
        # 404 (not 403) for non-participants so conversation ids don't leak.
        return get_object_or_404(
            services.conversations_for(self.request.user), pk=self.kwargs["conversation_id"]
        )

    def get_queryset(self):
        queryset = Message.objects.filter(conversation=self.get_conversation()).select_related("sender")
        after = self.request.query_params.get("after", "")
        if after.isdigit():
            queryset = queryset.filter(id__gt=int(after))
        return queryset

    def get_throttles(self):
        throttles = super().get_throttles()
        if self.request.method == "POST":
            self.throttle_scope = "message_create"
            throttles.append(ScopedRateThrottle())
        return throttles

    @extend_schema(summary="Send a message", responses={201: MessageSerializer})
    def create(self, request, *args, **kwargs):
        conversation = self.get_conversation()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = services.send_message(conversation, request.user, serializer.validated_data["text"])
        return success_response(
            self.get_serializer(message).data, "Message sent", status.HTTP_201_CREATED
        )


class MarkReadView(APIView):
    @extend_schema(request=None, responses={200: None}, summary="Mark the other person's messages as read")
    def post(self, request, conversation_id):
        conversation = get_object_or_404(
            services.conversations_for(request.user), pk=conversation_id
        )
        return success_response({"marked": services.mark_read(conversation, request.user)})


class UnreadCountView(APIView):
    @extend_schema(responses={200: None}, summary="Total unread messages")
    def get(self, request):
        return success_response({"count": services.unread_total(request.user)})