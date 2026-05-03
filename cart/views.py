from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction

from .models import Cart, CartItem
from .serializers import CartSerializer
from products.models import Product


class CartView(generics.RetrieveAPIView):
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        cart, _ = Cart.objects.prefetch_related('items__product').get_or_create(user=self.request.user)
        cart.refresh_from_db()
        return cart

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    product_id = request.data.get('product_id')
    quantity = request.data.get('quantity', 1)

    if not product_id:
        return Response({'error': 'product_id est requis'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        quantity = int(quantity)
        if quantity <= 0:
            return Response({'error': 'La quantité doit être positive'}, status=status.HTTP_400_BAD_REQUEST)
    except (ValueError, TypeError):
        return Response({'error': 'La quantité doit être positive'}, status=status.HTTP_400_BAD_REQUEST)

    product = get_object_or_404(Product, id=product_id)
    print(f'[ADD TO CART] Product: {product.name} (ID: {product.id}), Initial Stock: {product.stock}, Quantity to add: {quantity}')

    if product.stock < quantity:
        return Response({'error': f'Stock insuffisant. Disponible: {product.stock}'}, status=status.HTTP_400_BAD_REQUEST)

    cart, _ = Cart.objects.get_or_create(user=request.user)
    try:
        cart_item = CartItem.objects.get(cart=cart, product=product)
        print(f'[ADD TO CART] Item exists in cart with quantity: {cart_item.quantity}')
        cart_item.quantity += quantity
        cart_item.save()
        print(f'[ADD TO CART] Updated cart quantity to: {cart_item.quantity}')
    except CartItem.DoesNotExist:
        CartItem.objects.create(cart=cart, product=product, quantity=quantity)
        print(f'[ADD TO CART] Created new cart item with quantity: {quantity}')

    print(f'[ADD TO CART] Stock updated: {product.stock} -> {product.stock - quantity}')

    cart.refresh_from_db()
    response = Response({'message': 'Produit ajouté au panier', 'cart': CartSerializer(cart).data})
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    return response


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_cart_item(request, item_id):
    cart_item = get_object_or_404(CartItem, id=item_id, cart__user=request.user)
    quantity = int(request.data.get('quantity', 0))

    print(f'[UPDATE CART] Item ID: {item_id}, Product: {cart_item.product.name}, Old Qty: {cart_item.quantity}, New Qty: {quantity}')

    if quantity <= 0:
        with transaction.atomic():
            cart_item.delete()
        return Response({'message': 'Produit supprimé du panier'})

    qty_diff = quantity - cart_item.quantity
    print(f'[UPDATE CART] Stock before: {cart_item.product.stock}, Qty diff: {qty_diff}')

    if qty_diff > 0 and cart_item.product.stock < qty_diff:
        return Response({'error': f'Stock insuffisant. Disponible: {cart_item.product.stock}'}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        cart_item.quantity = quantity
        cart_item.save()
        print(f'[UPDATE CART] Stock after: {cart_item.product.stock}')

    return Response({'message': 'Quantité mise à jour', 'cart': CartSerializer(cart_item.cart).data})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_from_cart(request, item_id):
    cart_item = get_object_or_404(CartItem, id=item_id, cart__user=request.user)

    with transaction.atomic():
        cart = cart_item.cart
        cart_item.delete()

    return Response({'message': 'Produit supprimé du panier', 'cart': CartSerializer(cart).data})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_cart(request):
    """Clear all items from user's cart"""
    cart = get_object_or_404(Cart, user=request.user)
    restore_stock = request.query_params.get('restore_stock', '').lower() == 'true'

    with transaction.atomic():
        if restore_stock:
            print(f'[CLEAR CART] Restoring stock for {cart.items.count()} items')
            for item in cart.items.all():
                item.product.stock = item.product.stock + item.quantity
                item.product.save()
                print(f'[CLEAR CART] Restored {item.quantity} to {item.product.name}')
        else:
            print('[CLEAR CART] NOT restoring stock (checkout completed)')
        cart.items.all().delete()

    return Response({'message': 'Panier vidé'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def checkout_cart(request):
    """Process cart checkout and create order without payment"""
    cart = get_object_or_404(Cart, user=request.user)

    if not cart.items.exists():
        return Response({'error': 'Le panier est vide'}, status=status.HTTP_400_BAD_REQUEST)

    shipping_address = request.data.get('shipping_address', '')
    notes = request.data.get('notes', '')

    from django.apps import apps
    Order = apps.get_model('orders', 'Order')

    with transaction.atomic():
        order = Order.objects.create(
            user=request.user,
            shipping_address=shipping_address,
            notes=notes,
        )
        cart.items.all().delete()

    return Response({'message': 'Commande créée', 'order_id': order.id})
