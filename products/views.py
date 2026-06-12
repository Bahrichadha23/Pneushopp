from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Product, Category, SiteSettings
from .serializers import ProductSerializer, ProductDetailSerializer, CategorySerializer, SiteSettingsSerializer


class ProductListView(generics.ListAPIView):
    queryset = Product.objects.filter(is_active=True).select_related('category').order_by('-created_at')
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'brand', 'season', 'is_featured']
    # Added 'reference' and 'designation' to search_fields for DOT/FIFO achat search
    search_fields = ['name', 'brand', 'description', 'size', 'reference', 'designation']
    # fabrication_date en ordering_fields → permet le tri FIFO côté vente
    ordering_fields = ['price', 'created_at', 'name', 'fabrication_date']
    ordering = ['-created_at']

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        return response

    def get_queryset(self):
        queryset = super().get_queryset()
        params = self.request.query_params

        category_param = params.get('category')
        if category_param:
            queryset = queryset.filter(category__slug=category_param)

        category_slug = params.get('category_slug')
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)

        min_price = params.get('min_price')
        if min_price:
            queryset = queryset.filter(price__gte=str(min_price))

        max_price = params.get('max_price')
        if max_price:
            queryset = queryset.filter(price__lte=str(max_price))

        on_sale = params.get('on_sale')
        if on_sale and on_sale.lower() == 'true':
            queryset = queryset.filter(old_price__isnull=False)

        width = params.get('width')
        height = params.get('height')
        diameter = params.get('diameter')
        if width:
            queryset = queryset.filter(size__startswith=str(width))
        if height:
            queryset = queryset.filter(size__contains=f'/{height}')
        if diameter:
            queryset = queryset.filter(size__endswith=str(diameter))

        speed_rating = params.get('speedRating')
        if speed_rating:
            queryset = queryset.filter(size__icontains=speed_rating)

        load_index = params.get('loadIndex')
        if load_index:
            queryset = queryset.filter(size__icontains=load_index)

        return queryset


class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.filter(is_active=True).select_related('category')
    serializer_class = ProductDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        return response


class ProductUpdateView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        return response


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class FeaturedProductsView(generics.ListAPIView):
    queryset = Product.objects.filter(is_active=True, is_featured=True).select_related('category')
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]


class PromotionProductsView(generics.ListAPIView):
    """GET /api/products/promotions/ — liste des produits en promotion"""
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Product.objects.filter(
            is_active=True, old_price__isnull=False
        ).select_related('category').order_by('-updated_at')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_promotion(request):
    """
    POST /api/products/set-promotion/
    Body: {
      product_ids: [1, 2, 3],
      discount_percentage: 20,          # % de remise
      promotion_label: "SOLDES",        # optional
      promotion_end_date: "2026-06-30", # optional
      remove: false                     # true = retirer la promotion
    }
    """
    from decimal import Decimal
    ids = request.data.get('product_ids', [])
    discount = Decimal(str(request.data.get('discount_percentage', 0)))
    label = request.data.get('promotion_label', '')
    end_date = request.data.get('promotion_end_date', None)
    remove = request.data.get('remove', False)

    if not ids:
        return Response({'error': 'product_ids requis'}, status=400)

    products = Product.objects.filter(id__in=ids)
    updated = []
    names = []

    for product in products:
        if remove:
            # Retirer la promotion : restaurer l'ancien prix
            if product.old_price:
                product.price = product.old_price
            product.old_price = None
            product.promotion_label = None
            product.promotion_end_date = None
        else:
            if discount <= 0 or discount >= 100:
                return Response({'error': 'discount_percentage doit être entre 1 et 99'}, status=400)
            # Appliquer la promotion
            original_price = product.old_price if product.old_price else product.price
            product.old_price = original_price
            product.price = (original_price * (1 - discount / 100)).quantize(Decimal('0.001'))
            product.promotion_label = label or f'-{int(discount)}%'
            product.promotion_end_date = end_date or None
        product.save()
        updated.append(product.id)
        names.append(product.name)

    from accounts.activity import log_activity
    if remove:
        log_activity(
            request.user, 'remove_promotion',
            f"Retrait de la promotion sur {len(updated)} produit(s) : {', '.join(names[:5])}" + (f" (+{len(names)-5} autres)" if len(names) > 5 else ""),
            request=request,
        )
    else:
        log_activity(
            request.user, 'apply_promotion',
            f"Promotion -{discount}% ({label or 'sans label'}) appliquée à {len(updated)} produit(s) : {', '.join(names[:5])}" + (f" (+{len(names)-5} autres)" if len(names) > 5 else ""),
            request=request,
        )

    return Response({
        'updated': len(updated),
        'product_ids': updated,
        'action': 'removed' if remove else 'applied',
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def product_search_suggestions(request):
    """Get search suggestions for products"""
    query = request.query_params.get('q', '')
    if not query:
        return Response([])
    products = Product.objects.filter(
        is_active=True,
        name__icontains=query,
    ).values('brand', 'name')[:10]
    return Response(list(products))


@api_view(['GET'])
@permission_classes([AllowAny])
def product_filters(request):
    """Get available filter options"""
    brands = Product.objects.filter(is_active=True).values_list('brand', flat=True).distinct()
    seasons = Product.objects.filter(is_active=True).values_list('season', flat=True).distinct()
    prices = Product.objects.filter(is_active=True).values_list('price', flat=True)
    return Response({
        'brands': [b for b in brands if b],
        'seasons': [{'value': s, 'label': s} for s in seasons if s],
        'price_range': {
            'min': float(min(prices)) if prices else 0,
            'max': float(max(prices)) if prices else 0,
        },
    })


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([AllowAny])
def site_settings(request):
    settings_obj, _ = SiteSettings.objects.get_or_create(pk=1)
    if request.method in ('PUT', 'PATCH'):
        serializer = SiteSettingsSerializer(settings_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    return Response(SiteSettingsSerializer(settings_obj).data)
