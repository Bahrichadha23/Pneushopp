from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Sum, Avg, Min, Max
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta

from .models import Product, Category, Order, OrderItem, StockMovement
from .admin_serializers import AdminProductSerializer, AdminCategorySerializer, AdminProductCreateUpdateSerializer, StockMovementSerializer
from accounts.models import CustomUser

class AdminProductListCreateView(generics.ListCreateAPIView):
    """Admin view for listing and creating products"""
    queryset = Product.objects.all().select_related('category')
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'brand', 'season', 'is_featured', 'is_active']
    search_fields = ['name', 'brand', 'description', 'size']
    ordering_fields = ['price', 'created_at', 'name', 'stock']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AdminProductCreateUpdateSerializer
        return AdminProductSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Custom filters for admin
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        low_stock = self.request.query_params.get('low_stock')
        
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        if low_stock == 'true':
            queryset = queryset.filter(stock__lt=10)  # Low stock threshold
            
        return queryset

class AdminProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin view for retrieving, updating, and deleting a specific product"""
    queryset = Product.objects.all()
    permission_classes = [IsAdminUser]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return AdminProductCreateUpdateSerializer
        return AdminProductSerializer

class AdminCategoryListCreateView(generics.ListCreateAPIView):
    """Admin view for listing and creating categories"""
    queryset = Category.objects.annotate(product_count=Count('products'))
    serializer_class = AdminCategorySerializer
    permission_classes = [IsAdminUser]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    ordering = ['name']

class AdminCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin view for retrieving, updating, and deleting a specific category"""
    queryset = Category.objects.all()
    serializer_class = AdminCategorySerializer
    permission_classes = [IsAdminUser]

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_dashboard_stats(request):
    """Get dashboard statistics for admin"""
    
    # Basic counts
    total_products = Product.objects.count()
    active_products = Product.objects.filter(is_active=True).count()
    total_categories = Category.objects.count()
    total_customers = CustomUser.objects.filter(is_staff=False).count()
    
    # Order statistics
    total_orders = Order.objects.count()
    pending_orders = Order.objects.filter(status='pending').count()
    completed_orders = Order.objects.filter(status='completed').count()
    
    # Revenue statistics
    total_revenue = Order.objects.filter(status='completed').aggregate(
        total=Sum('total_amount')
    )['total'] or 0
    
    # Recent orders (last 30 days)
    thirty_days_ago = timezone.now() - timedelta(days=30)
    recent_orders = Order.objects.filter(created_at__gte=thirty_days_ago).count()
    recent_revenue = Order.objects.filter(
        created_at__gte=thirty_days_ago, 
        status='completed'
    ).aggregate(total=Sum('total_amount'))['total'] or 0
    
    # Low stock products (less than 10 items)
    low_stock_products = Product.objects.filter(stock__lt=10, is_active=True).count()
    
    # Featured products
    featured_products = Product.objects.filter(is_featured=True, is_active=True).count()
    
    # Products by category
    products_by_category = Category.objects.annotate(
        product_count=Count('products', filter=Q(products__is_active=True))
    ).values('name', 'product_count')
    
    # Top selling products (by quantity in completed orders)
    top_selling_products = OrderItem.objects.filter(
        order__status='completed'
    ).values(
        'product__id', 'product__name', 'product__brand'
    ).annotate(
        total_sold=Sum('quantity')
    ).order_by('-total_sold')[:5]
    
    # Recent orders details
    recent_orders_details = Order.objects.filter(
        created_at__gte=thirty_days_ago
    ).order_by('-created_at')[:5].values(
        'id', 'order_number', 'user__email', 'status', 'total_amount', 'created_at'
    )
    
    # Top stock products
    top_stock_products = Product.objects.filter(is_active=True).order_by('-stock')[:5].values(
        'id', 'name', 'brand', 'stock', 'price'
    )
    
    # Low stock products details
    low_stock_details = Product.objects.filter(
        stock__lt=10, is_active=True
    ).order_by('stock')[:5].values(
        'id', 'name', 'brand', 'stock', 'price'
    )
    
    # Price statistics
    price_stats = Product.objects.filter(is_active=True).aggregate(
        avg_price=Avg('price'),
        min_price=Min('price'),
        max_price=Max('price')
    )
    
    # Recent products (last 30 days)
    recent_products = Product.objects.filter(
        created_at__gte=thirty_days_ago
    ).count()
    
    # Orders by status
    orders_by_status = Order.objects.values('status').annotate(
        count=Count('id')
    ).order_by('status')
    
    return Response({
        'total_products': total_products,
        'active_products': active_products,
        'total_categories': total_categories,
        'total_customers': total_customers,
        'total_orders': total_orders,
        'pending_orders': pending_orders,
        'completed_orders': completed_orders,
        'total_revenue': float(total_revenue),
        'recent_orders': recent_orders,
        'recent_revenue': float(recent_revenue),
        'low_stock_products': low_stock_products,
        'featured_products': featured_products,
        'recent_products': recent_products,
        'products_by_category': list(products_by_category),
        'top_selling_products': list(top_selling_products),
        'recent_orders_details': list(recent_orders_details),
        'top_stock_products': list(top_stock_products),
        'low_stock_details': list(low_stock_details),
        'price_stats': price_stats,
        'orders_by_status': list(orders_by_status),
    })

@api_view(['POST'])
@permission_classes([IsAdminUser])
def bulk_update_products(request):
    """Bulk update products (e.g., prices, stock, status)"""
    product_ids = request.data.get('product_ids', [])
    updates = request.data.get('updates', {})
    
    if not product_ids or not updates:
        return Response(
            {'error': 'product_ids et updates sont requis'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        products = Product.objects.filter(id__in=product_ids)
        count = products.update(**updates)
        
        return Response({
            'message': f'{count} produits mis à jour avec succès',
            'updated_count': count
        })
    except Exception as e:
        return Response(
            {'error': f'Erreur lors de la mise à jour: {str(e)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    

class StockMovementListCreateView(generics.ListCreateAPIView):
    queryset = StockMovement.objects.all().select_related('product')
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated]