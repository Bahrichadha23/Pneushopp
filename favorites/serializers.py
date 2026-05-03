from rest_framework import serializers
from products.serializers import ProductSerializer
from .models import Favorite


class FavoriteSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = Favorite
        fields = ('id', 'product', 'created_at')


class FavoriteCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating favorites"""

    class Meta:
        model = Favorite
        fields = ('product',)

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['user'] = request.user
        return super().create(validated_data)
