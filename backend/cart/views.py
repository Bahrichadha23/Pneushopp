from rest_framework import status, generics
from rest_framework.decorators import api_view
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
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        return cart

@api_view(['POST'])
def add_to_cart(request):
    product_id = request.data.get('product_id')
    quantity = int(request.data.get('quantity', 1))
    
    if quantity <= 0:
        return Response({'error': 'La quantité doit être positive'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    product = get_object_or_404(Product, id=product_id, is_active=True)
    
    # Check stock availability
    if product.stock < quantity:
        return Response({'error': f'Stock insuffisant. Disponible: {product.stock}'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    cart, created = Cart.objects.get_or_create(user=request.user)
    
    with transaction.atomic():
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity}
        )
        
        if not created:
            new_quantity = cart_item.quantity + quantity
            if product.stock < new_quantity:
                return Response({'error': f'Stock insuffisant. Disponible: {product.stock}'}, 
                               status=status.HTTP_400_BAD_REQUEST)
            cart_item.quantity = new_quantity
            cart_item.save()
    
    return Response({
        'message': 'Produit ajouté au panier',
        'cart': CartSerializer(cart).data
    })

@api_view(['PUT'])
def update_cart_item(request, item_id):
    cart_item = get_object_or_404(CartItem, id=item_id, cart__user=request.user)
    quantity = int(request.data.get('quantity', 1))
    
    if quantity <= 0:
        cart_item.delete()
        message = 'Produit supprimé du panier'
    else:
        # Check stock availability
        if cart_item.product.stock < quantity:
            return Response({'error': f'Stock insuffisant. Disponible: {cart_item.product.stock}'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        cart_item.quantity = quantity
        cart_item.save()
        message = 'Quantité mise à jour'
    
    return Response({
        'message': message,
        'cart': CartSerializer(cart_item.cart).data
    })

@api_view(['DELETE'])
def remove_from_cart(request, item_id):
    cart_item = get_object_or_404(CartItem, id=item_id, cart__user=request.user)
    cart = cart_item.cart
    cart_item.delete()
    
    return Response({
        'message': 'Produit supprimé du panier',
        'cart': CartSerializer(cart).data
    })

@api_view(['DELETE'])
def clear_cart(request):
    """Clear all items from user's cart"""
    cart = get_object_or_404(Cart, user=request.user)
    cart.items.all().delete()
    
    return Response({
        'message': 'Panier vidé',
        'cart': CartSerializer(cart).data
    })
