import os
import subprocess
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from accounts.permanent_permissions import IsAdmin, IsAdminOrPurchasing, IsAdminOrSales
from .models import Product, Category, StockMovement, SiteSettings
from .admin_serializers import (
    AdminProductSerializer, AdminProductCreateUpdateSerializer,
    AdminCategorySerializer, StockMovementSerializer,
)
from .serializers import SiteSettingsSerializer


class AdminProductListCreateView(generics.ListCreateAPIView):
    """Admin view for listing and creating products"""
    queryset = Product.objects.all().select_related('category').order_by('-created_at')
    permission_classes = [IsAdminOrPurchasing]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'brand', 'season', 'is_featured', 'is_active']
    # Added reference and designation for FIFO/DOT achat searches
    search_fields = ['name', 'brand', 'description', 'size', 'reference', 'designation']
    ordering_fields = ['price', 'created_at', 'name', 'stock']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AdminProductCreateUpdateSerializer
        return AdminProductSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        params = self.request.query_params

        min_price = params.get('min_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)

        max_price = params.get('max_price')
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        low_stock = params.get('low_stock')
        if low_stock and low_stock.lower() == 'true':
            from django.db.models import F
            queryset = queryset.filter(stock__lte=F('stock_min'))

        return queryset


class AdminProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin view for retrieving, updating, and deleting a specific product"""
    queryset = Product.objects.all()
    permission_classes = [IsAdminOrPurchasing]

    def get_serializer_class(self):
        return AdminProductSerializer


class AdminCategoryListCreateView(generics.ListCreateAPIView):
    """Admin view for listing and creating categories"""
    queryset = Category.objects.all().order_by('name')
    serializer_class = AdminCategorySerializer
    permission_classes = [IsAdminOrPurchasing]


class AdminCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin view for retrieving, updating, and deleting a specific category"""
    queryset = Category.objects.all()
    serializer_class = AdminCategorySerializer
    permission_classes = [IsAdminOrPurchasing]


@api_view(['GET'])
@permission_classes([IsAdminOrSales])
def admin_dashboard_stats(request):
    """Get dashboard statistics for admin"""
    from orders.models import Order, OrderItem
    from accounts.models import CustomUser

    user = request.user
    if getattr(user, 'role', None) not in ('admin', 'sales') and not user.is_superuser:
        return Response({'error': 'Not authorized'}, status=403)

    total_products = Product.objects.count()
    active_products = Product.objects.filter(is_active=True).count()
    total_categories = Category.objects.count()
    total_customers = CustomUser.objects.filter(role='customer').count()
    total_orders = Order.objects.count()
    pending_orders = Order.objects.filter(status='pending').count()
    completed_orders = Order.objects.filter(status='delivered').count()

    from django.db.models import Sum
    total_revenue = Order.objects.filter(status='delivered').aggregate(total=Sum('total_amount'))['total'] or 0

    recent_orders = list(Order.objects.order_by('-created_at')[:5].values(
        'order_number', 'user__email', 'status', 'created_at', 'total_amount'
    ))

    low_stock_products = list(Product.objects.filter(stock__lte=5).order_by('stock').values(
        'brand', 'name', 'stock', 'price'
    )[:10])

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
        'low_stock_products': low_stock_products,
    })


@api_view(['POST'])
@permission_classes([IsAdmin])
def bulk_update_products(request):
    """Bulk update products (e.g., prices, stock, status)"""
    product_ids = request.data.get('product_ids')
    updates = request.data.get('updates')
    if not product_ids or not updates:
        return Response({'error': 'product_ids et updates sont requis'}, status=400)
    try:
        count = Product.objects.filter(id__in=product_ids).update(**updates)
        return Response({'message': f'{count} produits mis à jour avec succès'})
    except Exception as e:
        return Response({'error': f'Erreur lors de la mise à jour: {str(e)}'}, status=400)


@api_view(['GET'])
@permission_classes([IsAdminOrSales])
def reports_data(request):
    """Get comprehensive reports data for the reports page"""
    from orders.models import Order, OrderItem
    from accounts.models import CustomUser
    from django.db.models import Sum, Count

    total_revenue = Order.objects.filter(status='delivered').aggregate(total=Sum('total_amount'))['total'] or 0
    total_orders = Order.objects.count()

    return Response({
        'total_revenue': float(total_revenue),
        'total_orders': total_orders,
    })


@api_view(['GET'])
@permission_classes([IsAdmin])
def debug_database_stats(request):
    """Debug endpoint to check database content"""
    from orders.models import Order
    orders = list(Order.objects.order_by('-created_at')[:10].values(
        'order_number', 'status', 'total_amount', 'created_at'
    ))
    return Response({'orders': orders, 'total': Order.objects.count()})


@api_view(['GET'])
@permission_classes([IsAdmin])
def create_database_backup(request):
    """Create a database backup and return it as a downloadable file"""
    import json
    from django.core import serializers as django_serializers
    from django.apps import apps

    timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
    filename = f'backup_{timestamp}.json'

    try:
        result = subprocess.run(
            ['python', 'manage.py', 'dumpdata', '--natural-foreign', '--natural-primary', '--indent=2'],
            capture_output=True, text=True,
        )
        response = HttpResponse(result.stdout, content_type='application/json')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    except Exception as e:
        return Response({'error': f'Erreur lors de la création de la sauvegarde: {str(e)}'}, status=500)


@api_view(['GET'])
@permission_classes([IsAdmin])
def export_customer_data(request):
    """Export customer data as CSV file"""
    import csv
    from accounts.models import CustomUser
    from django.http import HttpResponse

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="customers.csv"'

    writer = csv.writer(response)
    writer.writerow(['username', 'email', 'first_name', 'last_name', 'phone', 'date_joined', 'last_login', 'is_active'])

    for user in CustomUser.objects.filter(role='customer'):
        writer.writerow([
            user.username, user.email, user.first_name, user.last_name,
            getattr(user, 'phone', ''), user.date_joined, user.last_login, user.is_active,
        ])

    return response


@api_view(['GET'])
@permission_classes([IsAdminOrPurchasing])
def stock_movements(request):
    """List stock movements"""
    movements = StockMovement.objects.select_related('product', 'created_by').order_by('-created_at')[:100]
    serializer = StockMovementSerializer(movements, many=True)
    return Response(serializer.data)
