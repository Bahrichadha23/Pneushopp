from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from accounts.permanent_permissions import IsAdminOrPurchasing
from .models import PurchaseOrder, PurchaseOrderItem
from .serializers import PurchaseOrderSerializer, PurchaseOrderItemSerializer, PurchaseOrderCreateSerializer


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing purchase orders (buying from suppliers)
    """
    queryset = PurchaseOrder.objects.all().prefetch_related('items')
    permission_classes = [IsAdminOrPurchasing]

    def get_serializer_class(self):
        if self.action == 'create':
            return PurchaseOrderCreateSerializer
        return PurchaseOrderSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        params = self.request.query_params

        status_param = params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        supplier = params.get('supplier')
        if supplier:
            queryset = queryset.filter(supplier_id=supplier)

        week = params.get('week')
        if week:
            queryset = queryset.filter(week=week)

        year = params.get('year')
        if year:
            queryset = queryset.filter(year=year)

        return queryset.order_by('-order_date')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        purchase_order = serializer.save()
        return Response(PurchaseOrderSerializer(purchase_order).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm a purchase order"""
        instance = self.get_object()
        if instance.status != 'draft':
            return Response({'error': 'Only draft orders can be confirmed'}, status=status.HTTP_400_BAD_REQUEST)
        instance.status = 'confirmed'
        instance.confirmed_date = timezone.now()
        instance.save()
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=['post'])
    def mark_received(self, request, pk=None):
        """Mark a purchase order as received"""
        instance = self.get_object()
        if instance.status != 'confirmed':
            return Response({'error': 'Only confirmed orders can be marked as received'}, status=status.HTTP_400_BAD_REQUEST)
        instance.status = 'received'
        instance.received_date = timezone.now()
        instance.save()
        for item in instance.items.all():
            if item.product:
                item.product.stock = item.product.stock + item.quantity
                item.product.save()
                item.received_quantity = item.quantity
                item.save()
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a purchase order"""
        instance = self.get_object()
        if instance.status == 'received':
            return Response({'error': 'Cannot cancel a received order'}, status=status.HTTP_400_BAD_REQUEST)
        instance.status = 'cancelled'
        instance.save()
        return Response(self.get_serializer(instance).data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get purchase order statistics"""
        queryset = self.get_queryset()
        return Response({
            'draft': queryset.filter(status='draft').count(),
            'confirmed': queryset.filter(status='confirmed').count(),
            'received': queryset.filter(status='received').count(),
            'cancelled': queryset.filter(status='cancelled').count(),
            'total': sum(float(po.total or 0) for po in queryset.filter(status='received')),
        })


class PurchaseOrderItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing purchase order items
    """
    queryset = PurchaseOrderItem.objects.all()
    serializer_class = PurchaseOrderItemSerializer
    permission_classes = [IsAdminOrPurchasing]

    def get_queryset(self):
        queryset = super().get_queryset()
        purchase_order = self.request.query_params.get('purchase_order')
        if purchase_order:
            queryset = queryset.filter(purchase_order_id=purchase_order)
        return queryset
