from django.urls import path
from . import views

urlpatterns = [
    path('messages/', views.MessageListCreateView.as_view(), name='message-list'),
    path('messages/<int:pk>/', views.MessageDetailView.as_view(), name='message-detail'),
    path('messages/<int:pk>/mark-done/', views.mark_done, name='message-mark-done'),
    path('messages/<int:pk>/in-progress/', views.mark_in_progress, name='message-in-progress'),
    path('messages/<int:message_id>/comments/', views.CommentListCreateView.as_view(), name='comment-list'),
    path('comments/<int:pk>/', views.CommentDetailView.as_view(), name='comment-detail'),
]
