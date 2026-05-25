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

    from django.db.models import Sum, Avg, Min, Max, Count

    total_products = Product.objects.count()
    active_products = Product.objects.filter(is_active=True).count()
    featured_products = Product.objects.filter(is_featured=True).count()
    recent_products = Product.objects.order_by('-created_at').count()
    total_categories = Category.objects.count()
    total_customers = CustomUser.objects.filter(role='customer').count()
    total_orders = Order.objects.count()
    pending_orders = Order.objects.filter(status='pending').count()
    completed_orders = Order.objects.filter(status='delivered').count()

    total_revenue = Order.objects.filter(status='delivered').aggregate(
        total=Sum('total_amount')
    )['total'] or 0

    recent_orders = list(Order.objects.order_by('-created_at')[:5].values(
        'order_number', 'user__email', 'status', 'created_at', 'total_amount'
    ))

    # Produits par catégorie
    products_by_category = list(
        Category.objects.annotate(product_count=Count('products'))
        .values('name', 'product_count')
        .order_by('-product_count')
    )

    # Stock élevé (top 5)
    top_stock_products = list(Product.objects.order_by('-stock').values(
        'id', 'name', 'brand', 'stock', 'price'
    )[:5])

    # Stock faible - count et détails
    low_stock_qs = Product.objects.filter(stock__lte=5).order_by('stock')
    low_stock_count = low_stock_qs.count()
    low_stock_details = list(low_stock_qs.values('id', 'name', 'brand', 'stock', 'price')[:10])

    # Statistiques des prix
    price_agg = Product.objects.aggregate(
        avg_price=Avg('price'),
        min_price=Min('price'),
        max_price=Max('price'),
    )
    price_stats = {
        'avg_price': float(price_agg['avg_price'] or 0),
        'min_price': float(price_agg['min_price'] or 0),
        'max_price': float(price_agg['max_price'] or 0),
    }

    return Response({
        'total_products': total_products,
        'active_products': active_products,
        'featured_products': featured_products,
        'recent_products': recent_products,
        'total_categories': total_categories,
        'total_customers': total_customers,
        'total_orders': total_orders,
        'pending_orders': pending_orders,
        'completed_orders': completed_orders,
        'total_revenue': float(total_revenue),
        'recent_orders': recent_orders,
        'products_by_category': products_by_category,
        'top_stock_products': top_stock_products,
        'low_stock_products': low_stock_count,
        'low_stock_details': low_stock_details,
        'price_stats': price_stats,
    })


@api_view(['POST'])
@permission_classes([IsAdmin])
def reset_all_products(request):
    """Delete ALL products and their DOT batches. Admin only. Irreversible."""
    from .models import StockBatch
    batches_count, _ = StockBatch.objects.all().delete()
    products_count, _ = Product.objects.all().delete()
    return Response({
        'success': True,
        'deleted_products': products_count,
        'deleted_batches': batches_count,
        'message': f'{products_count} produit(s) et {batches_count} lot(s) DOT supprimés.',
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
    from django.db.models import Sum, Count, Avg
    from django.utils import timezone
    from datetime import timedelta

    now = timezone.now()
    today_start    = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start     = today_start - timedelta(days=now.weekday())
    month_start    = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # ── Stats globales ──────────────────────────────────────────────────
    ventes_total    = Order.objects.aggregate(t=Sum('total_amount'))['t'] or 0
    commandes_total = Order.objects.count()
    panier_moyen    = Order.objects.aggregate(a=Avg('total_amount'))['a'] or 0
    clients_actifs  = CustomUser.objects.filter(role='customer', is_active=True).count()

    ventes_jour    = Order.objects.filter(created_at__gte=today_start).aggregate(t=Sum('total_amount'))['t'] or 0
    ventes_hebdo   = Order.objects.filter(created_at__gte=week_start).aggregate(t=Sum('total_amount'))['t'] or 0
    ventes_mensuel = Order.objects.filter(created_at__gte=month_start).aggregate(t=Sum('total_amount'))['t'] or 0

    commandes_jour    = Order.objects.filter(created_at__gte=today_start).count()
    commandes_hebdo   = Order.objects.filter(created_at__gte=week_start).count()
    commandes_mensuel = Order.objects.filter(created_at__gte=month_start).count()
    produits_vendus   = OrderItem.objects.aggregate(t=Sum('quantity'))['t'] or 0

    # ── Ventes par mois (6 derniers mois) ──────────────────────────────
    ventes_par_mois = []
    for i in range(5, -1, -1):
        # Calcul du premier jour du mois i mois en arrière
        target = (now.replace(day=1) - timedelta(days=i * 28)).replace(day=1)
        if i == 0:
            mois_start = month_start
            mois_end   = now
        else:
            mois_start = target
            if target.month == 12:
                mois_end = target.replace(year=target.year + 1, month=1)
            else:
                mois_end = target.replace(month=target.month + 1)

        mois_label = mois_start.strftime('%b %Y')
        mv = Order.objects.filter(created_at__gte=mois_start, created_at__lt=mois_end).aggregate(
            ventes=Sum('total_amount'), commandes=Count('id')
        )
        ventes_par_mois.append({
            'mois':      mois_label,
            'ventes':    float(mv['ventes'] or 0),
            'commandes': mv['commandes'] or 0,
        })

    # ── Top produits ────────────────────────────────────────────────────
    top_produits_qs = (
        OrderItem.objects
        .values('product_name')
        .annotate(ventes=Sum('quantity'), chiffre=Sum('total_price'))
        .order_by('-chiffre')[:10]
    )
    top_produits = [
        {'nom': r['product_name'], 'ventes': r['ventes'] or 0, 'chiffre': float(r['chiffre'] or 0)}
        for r in top_produits_qs
    ]

    # ── Top clients ─────────────────────────────────────────────────────
    top_clients_qs = (
        Order.objects
        .values('user__first_name', 'user__last_name', 'user__email')
        .annotate(commandes=Count('id'), total=Sum('total_amount'))
        .order_by('-total')[:10]
    )
    top_clients = []
    for r in top_clients_qs:
        nom = f"{r['user__first_name']} {r['user__last_name']}".strip() or r['user__email']
        top_clients.append({
            'nom':       nom,
            'commandes': r['commandes'] or 0,
            'total':     float(r['total'] or 0),
        })

    return Response({
        'stats_ventes': {
            'ventes_jour':        float(ventes_jour),
            'ventes_hebdo':       float(ventes_hebdo),
            'ventes_mensuel':     float(ventes_mensuel),
            'commandes_jour':     commandes_jour,
            'commandes_hebdo':    commandes_hebdo,
            'commandes_mensuel':  commandes_mensuel,
            'clients_actifs':     clients_actifs,
            'produits_vendus':    produits_vendus,
            'ventes_total':       float(ventes_total),
            'commandes_total':    commandes_total,
            'panier_moyen':       float(panier_moyen),
        },
        'ventes_par_mois': ventes_par_mois,
        'top_produits':    top_produits,
        'top_clients':     top_clients,
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
def product_dot_batches(request, product_id):
    """Return DOT batches for a product ordered oldest-first (FEFO)."""
    from .models import StockBatch
    batches = (
        StockBatch.objects
        .filter(product_id=product_id, quantity__gt=0)
        .order_by('dot_date', 'created_at')
        .values('id', 'quantity', 'dot', 'dot_date', 'emplacement', 'notes', 'created_at')
    )
    return Response(list(batches))


@api_view(['POST'])
@permission_classes([IsAdminOrPurchasing])
def consume_dot_batch(request, product_id):
    """Consume from a specific DOT batch; records a StockMovement linked to a client."""
    from .models import StockBatch, StockMovement
    from django.db import transaction

    batch_id = request.data.get('batch_id')
    try:
        quantity = int(request.data.get('quantity', 1))
    except (ValueError, TypeError):
        return Response({'error': 'Quantite invalide'}, status=400)
    reason = request.data.get('reason', 'vente')
    client_name = (request.data.get('client_name') or '').strip()
    client_id = request.data.get('client_id')

    if not batch_id:
        return Response({'error': 'batch_id requis'}, status=400)
    if quantity < 1:
        return Response({'error': 'Quantite invalide'}, status=400)

    try:
        with transaction.atomic():
            batch = StockBatch.objects.select_for_update().get(id=batch_id, product_id=product_id)
            if batch.quantity < quantity:
                return Response(
                    {'error': f'Stock insuffisant dans ce lot ({batch.quantity} disponible(s))'},
                    status=400,
                )
            batch.quantity -= quantity
            batch.save()

            product = batch.product
            product.stock = max(0, product.stock - quantity)
            product.save()

        # Build reference string
        ref_parts = []
        if batch.dot:
            ref_parts.append(f'DOT:{batch.dot}')
        if client_name:
            ref_parts.append(f'Client:{client_name}')
        reference = ' | '.join(ref_parts)[:100]

        # Log the movement outside the atomic block so a logging failure
        # never rolls back the critical stock/batch changes.
        try:
            StockMovement.objects.create(
                product=product,
                product_name=product.name,
                type='out',
                quantity=-quantity,
                reason=reason,
                reference=reference,
                created_by=request.user if request.user.is_authenticated else None,
            )
        except Exception as log_err:
            print(f'[CONSUME_BATCH] StockMovement log failed (non-critical): {log_err}')

        return Response({
            'success': True,
            'new_stock': product.stock,
            'batch_remaining': batch.quantity,
        })
    except StockBatch.DoesNotExist:
        return Response({'error': 'Lot introuvable'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAdminOrPurchasing])
def add_dot_batch(request, product_id):
    """Manually add a DOT batch and increase the product stock."""
    from .models import StockBatch, StockMovement, dot_to_date, Product
    from django.db import transaction

    dot = (request.data.get('dot') or '').strip()
    try:
        quantity = int(request.data.get('quantity', 1))
    except (ValueError, TypeError):
        return Response({'error': 'Quantite invalide'}, status=400)
    emplacement = (request.data.get('emplacement') or '').strip()

    if not dot:
        return Response({'error': 'DOT requis'}, status=400)
    if quantity < 1:
        return Response({'error': 'Quantite invalide'}, status=400)

    try:
        with transaction.atomic():
            product = Product.objects.get(id=product_id)
            dot_date = dot_to_date(dot)

            batch = StockBatch.objects.create(
                product=product,
                quantity=quantity,
                dot=dot,
                dot_date=dot_date,
                emplacement=emplacement or product.emplacement or '',
            )

            product.stock = product.stock + quantity
            product.save()

        # Log the movement outside the atomic block so a logging failure
        # never rolls back the critical stock/batch changes.
        try:
            StockMovement.objects.create(
                product=product,
                product_name=product.name,
                type='in',
                quantity=quantity,
                reason='ajout_manuel',
                reference=f'DOT:{dot}'[:100],
                created_by=request.user if request.user.is_authenticated else None,
            )
        except Exception as log_err:
            print(f'[ADD_BATCH] StockMovement log failed (non-critical): {log_err}')

        return Response({'success': True, 'new_stock': product.stock, 'batch_id': batch.id})
    except Product.DoesNotExist:
        return Response({'error': 'Produit introuvable'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAdminOrPurchasing])
def customer_search(request):
    """Search customers by name or email (for the DOT sell form)."""
    from accounts.models import CustomUser
    from django.db.models import Q
    q = (request.query_params.get('q') or '').strip()
    if len(q) < 2:
        return Response([])
    customers = (
        CustomUser.objects
        .filter(Q(email__icontains=q) | Q(first_name__icontains=q) | Q(last_name__icontains=q))
        .values('id', 'email', 'first_name', 'last_name', 'phone')[:10]
    )
    return Response([{
        'id': c['id'],
        'email': c['email'],
        'name': f"{c['first_name']} {c['last_name']}".strip() or c['email'],
        'phone': c['phone'],
    } for c in customers])


@api_view(['GET'])
@permission_classes([IsAdminOrPurchasing])
def stock_movements(request):
    """List stock movements — or DOT batches if ?type=dot_batches"""
    if request.GET.get('type') == 'dot_batches':
        from .models import StockBatch
        batches = (
            StockBatch.objects
            .select_related('product')
            .filter(quantity__gt=0)
            .order_by('dot_date', 'created_at')
        )
        data = [
            {
                'id': b.id,
                'product_id': b.product_id,
                'product_name': b.product.name if b.product else '',
                'product_brand': b.product.brand if b.product else '',
                'product_size': b.product.size if b.product and hasattr(b.product, 'size') else '',
                'quantity': b.quantity,
                'dot': b.dot,
                'dot_date': str(b.dot_date) if b.dot_date else None,
                'emplacement': b.emplacement,
                'created_at': b.created_at.isoformat(),
            }
            for b in batches
        ]
        return Response(data)

    movements = StockMovement.objects.select_related('product', 'created_by').order_by('-created_at')[:100]
    serializer = StockMovementSerializer(movements, many=True)
    return Response(serializer.data)
