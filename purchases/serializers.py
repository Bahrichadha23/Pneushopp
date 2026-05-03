from rest_framework import serializers
from .models import PurchaseOrder, PurchaseOrderItem
from suppliers.models import Supplier
from products.models import Product


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    """Serializer for purchase order items"""

    class Meta:
        model = PurchaseOrderItem
        fields = ('id', 'product', 'reference', 'designation', 'unit_price_ht', 'quantity', 'discount', 'total_ht', 'received_quantity', 'created_at')
        read_only_fields = ('id', 'total_ht', 'created_at')


class PurchaseOrderSerializer(serializers.ModelSerializer):
    """Serializer for purchase orders"""
    items = PurchaseOrderItemSerializer(many=True, required=False)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, allow_null=True)

    class Meta:
        model = PurchaseOrder
        fields = ('id', 'order_number', 'invoice_number', 'supplier', 'supplier_name', 'note', 'week', 'year',
                  'subtotal', 'global_discount', 'total', 'status', 'created_by', 'created_by_name',
                  'order_date', 'confirmed_date', 'received_date', 'updated_at', 'items')
        read_only_fields = ('id', 'order_number', 'order_date', 'updated_at', 'created_by')

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        purchase_order = PurchaseOrder.objects.create(**validated_data)
        for item_data in items_data:
            PurchaseOrderItem.objects.create(purchase_order=purchase_order, **item_data)
        return purchase_order

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                PurchaseOrderItem.objects.create(purchase_order=instance, **item_data)
        return instance


class PurchaseOrderCreateSerializer(serializers.Serializer):
    """
    Simplified serializer for creating purchase orders from frontend
    Matches the structure sent by the frontend
    """
    supplier = serializers.IntegerField()
    date_commande = serializers.DateField(required=False)
    date_livraison_prevue = serializers.DateField(required=False)
    total_ht = serializers.DecimalField(max_digits=12, decimal_places=3, required=False)
    total_ttc = serializers.DecimalField(max_digits=12, decimal_places=3, required=False)
    note = serializers.CharField(required=False, allow_blank=True)
    invoice_number = serializers.CharField(required=False, allow_blank=True)
    week = serializers.CharField(required=False, allow_blank=True)
    year = serializers.CharField(required=False, allow_blank=True)
    global_discount = serializers.DecimalField(max_digits=5, decimal_places=2, default=0, required=False)
    articles = serializers.ListField(child=serializers.DictField())

    def create(self, validated_data):
        articles_data = validated_data.pop('articles', [])
        supplier_id = validated_data.pop('supplier')
        supplier = Supplier.objects.get(id=supplier_id)

        request = self.context.get('request')
        user = request.user if request and hasattr(request, 'user') else None

        purchase_order = PurchaseOrder.objects.create(
            supplier=supplier,
            created_by=user,
            status='confirmed',
            invoice_number=validated_data.get('invoice_number', ''),
            note=validated_data.get('note', ''),
            week=validated_data.get('week', ''),
            year=validated_data.get('year', ''),
            global_discount=validated_data.get('global_discount', 0),
        )

        subtotal = 0
        for article in articles_data:
            # Find product by id or reference
            product = None
            product_id = article.get('id')
            reference = str(article.get('reference', '')).strip()
            if product_id:
                try:
                    product = Product.objects.filter(id=int(product_id)).first()
                except (ValueError, TypeError):
                    pass
            if not product and reference:
                product = Product.objects.filter(reference=reference).first()
            if not product and reference:
                raise serializers.ValidationError(
                    f'Produit non trouvé pour la référence: {reference}. Vérifiez la référence ou l\'ID.'
                )

            quantity = int(article.get('quantite') or article.get('quantity') or 1)
            unit_price = float(article.get('prix_unitaire') or article.get('priceHT') or 0)
            discount = float(article.get('discount') or 0)
            total_item_ht = float(article.get('totalHT') or (unit_price * quantity * (1 - discount / 100)))

            item = PurchaseOrderItem.objects.create(
                purchase_order=purchase_order,
                product=product,
                reference=reference or (product.reference if product else ''),
                designation=article.get('nom') or article.get('designation') or (product.name if product else ''),
                unit_price_ht=unit_price,
                quantity=quantity,
                discount=discount,
                total_ht=total_item_ht,
                received_quantity=quantity,
            )
            subtotal += total_item_ht

            # Update stock: buying from supplier → stock INCREASES
            if product:
                product.stock = product.stock + quantity
                product.save()
                print(f'✅ Stock updated: {product.name} - Added {quantity} units. New stock: {product.stock}')

        global_discount = float(validated_data.get('global_discount') or 0)
        purchase_order.subtotal = subtotal
        purchase_order.total = subtotal * (1 - global_discount / 100)
        purchase_order.orders_count = 1
        purchase_order.save()

        # Update supplier order count
        supplier.orders_count = (supplier.orders_count or 0) + 1
        supplier.save()

        return purchase_order
