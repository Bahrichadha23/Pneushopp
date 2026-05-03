from rest_framework import serializers
from .models import Delivery, Order, OrderItem, PurchaseOrder, PurchaseOrderItem, CRIBalance
from accounts.serializers import UserSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = '__all__'


class OrderSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    order_number = serializers.CharField(read_only=True)
    warranty = serializers.JSONField(required=False, write_only=True)
    delivery_cost = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)

    class Meta:
        model = Order
        fields = '__all__'

    def create(self, validated_data):
        from django.utils import timezone
        from decimal import Decimal

        items_data = validated_data.pop('items', [])
        warranty_data = validated_data.pop('warranty', None)

        if warranty_data:
            validated_data['warranty_accepted'] = warranty_data.get('accepted', False)
            validated_data['warranty_vehicle_registration'] = warranty_data.get('vehicleRegistration', '')
            validated_data['warranty_vehicle_mileage'] = warranty_data.get('vehicleMileage', '')

        order = Order.objects.create(**validated_data)

        if order.payment_method in ('cri', 'mixed') and order.cri_remaining > 0:
            user = order.user
            cri_balance, _ = CRIBalance.objects.get_or_create(user=user)
            cri_balance.balance = cri_balance.balance + Decimal(str(order.cri_remaining))
            cri_balance.save()

        if not order.order_number:
            year = timezone.now().strftime('%y')
            prefix = f'CPS{year}'
            last_order = Order.objects.filter(
                order_number__startswith=prefix
            ).order_by('-order_number').first()

            if last_order and last_order.order_number:
                try:
                    last_seq = int(last_order.order_number[len(prefix):])
                except (ValueError, IndexError):
                    last_seq = 0
            else:
                last_seq = 0

            order.order_number = f'{prefix}{last_seq + 1:06d}'
            order.save()

        for item in items_data:
            OrderItem.objects.create(order=order, **item)

        return order


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrderItem
        fields = '__all__'


class PurchaseOrderSerializer(serializers.ModelSerializer):
    articles = PurchaseOrderItemSerializer(many=True, required=False)
    order = serializers.PrimaryKeyRelatedField(queryset=Order.objects.all(), required=False, allow_null=True)
    order_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = PurchaseOrder
        fields = '__all__'

    def validate_order(self, value):
        """Custom validation for order field"""
        return value

    def create(self, validated_data):
        from products.models import Product
        from django.db import transaction

        articles_data = validated_data.pop('articles', [])

        with transaction.atomic():
            purchase_order = PurchaseOrder.objects.create(**validated_data)

            for article_data in articles_data:
                PurchaseOrderItem.objects.create(
                    purchase_order=purchase_order,
                    nom=article_data.get('nom'),
                    quantite=article_data.get('quantite'),
                    prix_unitaire=article_data.get('prix_unitaire'),
                )

                # ── Mise à jour du stock produit ──────────────────────────
                product_id = article_data.get('id')
                quantite = int(article_data.get('quantite') or 0)
                if product_id and quantite > 0:
                    try:
                        product = Product.objects.select_for_update().get(pk=product_id)
                        product.stock = (product.stock or 0) + quantite

                        # Mettre à jour l'emplacement si fourni
                        emplacement = article_data.get('emplacement', '')
                        if emplacement:
                            product.emplacement = emplacement

                        # Mettre à jour la date de fabrication (DOT) si fournie
                        dot = article_data.get('dot', '')
                        if dot and '.' in dot:
                            try:
                                from datetime import date as _date
                                week_str, year_str = dot.strip().split('.')
                                week = int(week_str)
                                year = int('20' + year_str) if len(year_str) == 2 else int(year_str)
                                if 1 <= week <= 52:
                                    jan1 = _date(year, 1, 1)
                                    fab_date = _date.fromordinal(jan1.toordinal() + (week - 1) * 7)
                                    product.fabrication_date = fab_date
                            except (ValueError, AttributeError):
                                pass

                        product.save()
                        print(f'[ACHAT] Stock +{quantite} → produit #{product_id} "{product.name}" nouveau stock: {product.stock}')
                    except Product.DoesNotExist:
                        print(f'[ACHAT] Produit #{product_id} introuvable — stock non mis à jour')

        return purchase_order

    def update(self, instance, validated_data):
        instance.order = validated_data.get('order', instance.order)
        instance.statut = validated_data.get('statut', instance.statut)
        instance.priorite = validated_data.get('priorite', instance.priorite)
        instance.date_commande = validated_data.get('date_commande', instance.date_commande)
        instance.date_livraison_prevue = validated_data.get('date_livraison_prevue', instance.date_livraison_prevue)
        instance.total_ht = validated_data.get('total_ht', instance.total_ht)
        instance.total_ttc = validated_data.get('total_ttc', instance.total_ttc)
        instance.save()

        articles_data = validated_data.pop('articles', [])
        if articles_data is not None:
            instance.articles.all().delete()
            for article_data in articles_data:
                PurchaseOrderItem.objects.create(
                    purchase_order=instance,
                    nom=article_data.get('nom'),
                    quantite=article_data.get('quantite'),
                    prix_unitaire=article_data.get('prix_unitaire'),
                )

        print(f'DEBUG: PO {instance.id} - Status: {instance.statut}, Order: {instance.order}')

        if instance.statut == 'confirmé':
            delivery_identifier = f'PO-{instance.id}'
            existing_delivery = Delivery.objects.filter(purchase_order=instance).first()
            if not existing_delivery:
                try:
                    if instance.order and instance.order.user:
                        first_name = instance.order.user.first_name or ''
                        last_name = instance.order.user.last_name or ''
                        client_name = f'{first_name} {last_name}'.strip()
                        if not client_name:
                            client_name = instance.order.user.email
                    else:
                        client_name = 'Client inconnu'

                    shipping_address = ''
                    if instance.order and instance.order.shipping_address:
                        addr = instance.order.shipping_address
                        shipping_address = addr.get('street', '') if isinstance(addr, dict) else str(addr)

                    new_delivery = Delivery.objects.create(
                        purchase_order=instance,
                        order=instance.order,
                        client=client_name,
                        adresse=shipping_address or 'Entrepôt principal',
                        transporteur='À assigner',
                        statut='prepare',
                        colis=sum(item.quantite for item in instance.articles.all()),
                    )
                    print(f'SUCCESS: Created delivery {new_delivery.id} for PO {instance.id} - Client: {client_name}')
                except Exception as e:
                    print(f'ERROR: Failed to create delivery for PO {instance.id}: {e}')
            else:
                print(f'SKIP: Delivery already exists for PO {instance.id}')

        return instance


class DeliverySerializer(serializers.ModelSerializer):
    commande = serializers.SerializerMethodField()
    dateExpedition = serializers.DateField(source='date_expedition', read_only=True)
    dateLivraison = serializers.DateField(source='date_livraison', read_only=True)

    def get_commande(self, obj):
        if obj.purchase_order:
            return f'PO-{obj.purchase_order.id}'
        if obj.order:
            return str(obj.order.id)
        return 'N/A'

    class Meta:
        model = Delivery
        fields = '__all__'
