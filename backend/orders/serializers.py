from rest_framework import serializers
from .models import Delivery, Order, OrderItem, PurchaseOrder, PurchaseOrderItem
from accounts.serializers import UserSerializer  # import your CustomUser serializer

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = "__all__"


class OrderSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = "__all__"

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        for item in items_data:
            OrderItem.objects.create(order=order, **item)
        return order




class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = PurchaseOrderItem
        fields = ["id", "nom", "quantite", "prix_unitaire"]

# class PurchaseOrderSerializer(serializers.ModelSerializer):
#     articles = PurchaseOrderItemSerializer(many=True)

#     class Meta:
#         model = PurchaseOrder
#         fields = ["id", "fournisseur", "date_commande", "date_livraison_prevue", "total_ht", "total_ttc", "statut", "priorite", "articles"]

#     def create(self, validated_data):
#         articles_data = validated_data.pop('articles', [])
#         purchase_order = PurchaseOrder.objects.create(**validated_data)

#         for article_data in articles_data:
#             PurchaseOrderItem.objects.create(
#                 purchase_order=purchase_order,
#                 **article_data
#             )
#         return purchase_order
class PurchaseOrderSerializer(serializers.ModelSerializer):
    articles = PurchaseOrderItemSerializer(many=True)
    order = serializers.PrimaryKeyRelatedField(queryset=Order.objects.all(), required=True)
    order_id = serializers.IntegerField(source="order.id", read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = ["id","order_id","order", "fournisseur", "date_commande", "date_livraison_prevue", "total_ht", "total_ttc", "statut", "priorite", "articles"]

    def create(self, validated_data):
        articles_data = validated_data.pop("articles", [])
        purchase_order = PurchaseOrder.objects.create(**validated_data)

        for article_data in articles_data:
            PurchaseOrderItem.objects.create(
                purchase_order=purchase_order,
                nom=article_data.get("nom"),
                quantite=article_data.get("quantite"),
                prix_unitaire=article_data.get("prix_unitaire")
            )
        return purchase_order
    def update(self, instance, validated_data):
        # Update basic fields
        instance.order = validated_data.get("order", instance.order)

        instance.statut = validated_data.get("statut", instance.statut)
        instance.priorite = validated_data.get("priorite", instance.priorite)
        instance.date_commande = validated_data.get("date_commande", instance.date_commande)
        instance.date_livraison_prevue = validated_data.get("date_livraison_prevue", instance.date_livraison_prevue)
        instance.total_ht = validated_data.get("total_ht", instance.total_ht)
        instance.total_ttc = validated_data.get("total_ttc", instance.total_ttc)
        instance.save()

        # Update articles if provided
        articles_data = validated_data.get("articles")
        if articles_data is not None:
            instance.articles.all().delete()
            for article_data in articles_data:
                PurchaseOrderItem.objects.create(
                    purchase_order=instance,
                    nom=article_data.get("nom"),
                    quantite=article_data.get("quantite"),
                    prix_unitaire=article_data.get("prix_unitaire")
                )
        
        if instance.statut == "confirmé" and instance.order:
                Delivery.objects.create(
                    order=instance.order,
                    client=instance.fournisseur,
                    adresse="",
                    transporteur="",
                    statut="prepare",
                    colis=sum(item.quantite for item in instance.articles.all())
                )


        return instance

class DeliverySerializer(serializers.ModelSerializer):
    commande = serializers.CharField(source="order.id", read_only=True)

    class Meta:
        model = Delivery
        fields = [
            "id", "commande", "client", "adresse", "transporteur",
            "statut", "date_expedition", "date_livraison", "colis"
        ]