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
    ordering_fields = ['price', 'created_at', 'name']
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
