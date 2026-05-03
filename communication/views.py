from django.utils import timezone

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permanent_permissions import IsAdmin
from accounts.email_utils import send_support_message_notification_email
from .models import Message, MessageComment
from .serializers import MessageSerializer, MessageCommentSerializer


class MessageListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/communication/messages/  → list (all staff see all; customers see none)
    POST /api/communication/messages/  → create a new change-request message
    """
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Message.objects.select_related('author', 'done_by').prefetch_related('comments')

        status_param = self.request.query_params.get('status')
        priority = self.request.query_params.get('priority')

        if status_param:
            queryset = queryset.filter(status=status_param)
        if priority:
            queryset = queryset.filter(priority=priority)

        return queryset

    def perform_create(self, serializer):
        message = serializer.save(author=self.request.user)
        send_support_message_notification_email(message)


class MessageDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/communication/messages/<id>/
    PATCH  /api/communication/messages/<id>/  → update status / priority (admin only for status=done)
    DELETE /api/communication/messages/<id>/  → admin only
    """
    queryset = Message.objects.select_related('author', 'done_by').prefetch_related('comments__author')
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        data = serializer.validated_data
        if data.get('is_done'):
            serializer.save(
                is_done=True,
                status='done',
                done_by=self.request.user,
                done_at=timezone.now(),
            )
        else:
            serializer.save()


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_done(request, pk):
    """PATCH /api/communication/messages/<id>/mark-done/ — admin marks a message as done."""
    try:
        message = Message.objects.get(pk=pk)
    except Message.DoesNotExist:
        return Response({'error': 'Message introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    message.is_done = True
    message.status = 'done'
    message.done_by = request.user
    message.done_at = timezone.now()
    message.save()
    serializer = MessageSerializer(message)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_in_progress(request, pk):
    """POST /api/communication/messages/<id>/in-progress/ — admin sets status to in_progress."""
    try:
        message = Message.objects.get(pk=pk)
    except Message.DoesNotExist:
        return Response({'error': 'Message introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    message.is_done = False
    message.status = 'in_progress'
    message.save()
    serializer = MessageSerializer(message)
    return Response(serializer.data)


class CommentListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/communication/messages/<message_id>/comments/
    POST /api/communication/messages/<message_id>/comments/
    """
    serializer_class = MessageCommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MessageComment.objects.filter(
            message_id=self.kwargs['message_id']
        ).select_related('author')

    def perform_create(self, serializer):
        user = self.request.user
        is_dev = getattr(user, 'is_superuser', False) or getattr(user, 'role', '') == 'admin'
        serializer.save(
            author=user,
            message_id=self.kwargs['message_id'],
            is_developer=is_dev,
        )


class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """PATCH / DELETE a specific comment (only author or admin)."""
    queryset = MessageComment.objects.select_related('author')
    serializer_class = MessageCommentSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        serializer.save()
