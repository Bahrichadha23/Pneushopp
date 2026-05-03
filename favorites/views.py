from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import IntegrityError

from .models import Favorite
from .serializers import FavoriteSerializer
from products.models import Product


class FavoriteListView(generics.ListAPIView):
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(
            user=self.request.user
        ).select_related('product', 'product__category')


@api_view(['POST'])
def add_to_favorites(request):
    product_id = request.data.get('product_id')
    product = get_object_or_404(Product, id=product_id)
    try:
        fav, created = Favorite.objects.get_or_create(user=request.user, product=product)
        message = 'Produit ajouté aux favoris' if created else 'Produit déjà dans les favoris'
        return Response({'message': message, **FavoriteSerializer(fav).data})
    except IntegrityError:
        return Response({'message': 'Produit déjà dans les favoris'})


@api_view(['DELETE'])
def remove_from_favorites(request, product_id):
    fav = get_object_or_404(Favorite, user=request.user, product_id=product_id)
    fav.delete()
    return Response({'message': 'Produit supprimé des favoris'})


@api_view(['GET'])
def check_favorite(request, product_id):
    is_favorite = Favorite.objects.filter(user=request.user, product_id=product_id).exists()
    return Response({'is_favorite': is_favorite})


@api_view(['DELETE'])
def clear_favorites(request):
    """Clear all favorites for user"""
    count, _ = Favorite.objects.filter(user=request.user).delete()
    return Response({'message': f'{count} favoris supprimés'})


@api_view(['POST'])
def toggle_favorite(request, product_id):
    """Toggle favorite status for a product"""
    product = get_object_or_404(Product, id=product_id)
    existing = Favorite.objects.filter(user=request.user, product=product).first()
    if existing:
        existing.delete()
        return Response({'message': 'Produit supprimé des favoris', 'is_favorite': False})
    else:
        fav = Favorite.objects.create(user=request.user, product=product)
        return Response({'message': 'Produit ajouté aux favoris', 'is_favorite': True, **FavoriteSerializer(fav).data})
