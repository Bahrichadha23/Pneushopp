from rest_framework import serializers
from .models import Product, Category, StockMovement


class AdminCategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = '__all__'

    def get_product_count(self, obj):
        return obj.products.count()


class AdminProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    season_display = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'

    def get_season_display(self, obj):
        return obj.get_season_display()


class AdminProductCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating products"""

    class Meta:
        model = Product
        fields = '__all__'

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError('Le prix doit être positif')
        return value

    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError('Le stock ne peut pas être négatif')
        return value

    def validate(self, data):
        old_price = data.get('old_price')
        price = data.get('price')
        if old_price and price and old_price <= price:
            raise serializers.ValidationError("L'ancien prix doit être supérieur au prix actuel")
        return data


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = StockMovement
        fields = '__all__'
