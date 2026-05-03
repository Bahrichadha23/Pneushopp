from django.contrib import admin
from .models import Message, MessageComment


class MessageCommentInline(admin.TabularInline):
    model = MessageComment
    extra = 0


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'priority', 'status', 'is_done', 'created_at']
    list_filter = ['status', 'priority', 'is_done']
    inlines = [MessageCommentInline]


@admin.register(MessageComment)
class MessageCommentAdmin(admin.ModelAdmin):
    list_display = ['author', 'message', 'is_developer', 'created_at']
