from rest_framework import serializers
from .models import Message, MessageComment


class MessageCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = MessageComment
        fields = ['id', 'message', 'author', 'author_name', 'content', 'is_developer', 'created_at']
        read_only_fields = ['author', 'is_developer', 'created_at']

    def get_author_name(self, obj):
        return obj.author.get_full_name() or obj.author.email


class MessageSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    done_by_name = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    comments = MessageCommentSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = [
            'id', 'title', 'content', 'status', 'priority',
            'created_at', 'updated_at', 'is_done', 'done_at',
            'author', 'author_name', 'done_by', 'done_by_name',
            'comment_count', 'comments',
        ]
        read_only_fields = ['author', 'created_at', 'updated_at', 'is_done', 'done_at', 'done_by']

    def get_author_name(self, obj):
        return obj.author.get_full_name() or obj.author.email

    def get_done_by_name(self, obj):
        if obj.done_by:
            return obj.done_by.get_full_name() or obj.done_by.email
        return None

    def get_comment_count(self, obj):
        return obj.comments.count()
