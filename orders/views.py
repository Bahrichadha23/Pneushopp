import uuid
from rest_framework import generics, permissions, viewsets
from rest_framework.decorators import api_view, permission_classes as perm_classes
from rest_framework.response import Response
from .models import Delivery, Order, PurchaseOrder, CRIBalance
from .serializers import DeliverySerializer, OrderSerializer, PurchaseOrderSerializer
from rest_framework.permissions import IsAuthenticated
from accounts.permanent_permissions import IsAdmin, IsAdminOrSales


class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Order.objects.all().prefetch_related('items').select_related('user')
    serializer_class = OrderSerializer
    permission_classes = [IsAdminOrSales]

    def perform_update(self, serializer):
        from accounts.email_utils import send_order_status_update_email, send_delivery_invoice_email
        old_status = self.get_object().status
        order = serializer.save()
        try:
            send_order_status_update_email(order)
        except Exception as e:
            print(f'[ORDER UPDATE] Failed to send status update email: {str(e)}')
        if order.status == 'delivered' and old_status != 'delivered':
            try:
                send_delivery_invoice_email(order)
            except Exception as e:
                print(f'[ORDER UPDATE] Failed to send delivery invoice email: {str(e)}')


class OrderListCreateView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        params = self.request.query_params
        if user.is_staff or user.is_superuser or getattr(user, 'role', None) in ('admin', 'sales'):
            queryset = Order.objects.all().prefetch_related('items').select_related('user').order_by('-created_at')
        else:
            queryset = Order.objects.filter(user=user).prefetch_related('items').select_related('user').order_by('-created_at')

        status = params.get('status')
        payment_status = params.get('payment_status')
        payment_method = params.get('payment_method')
        date_from = params.get('date_from')
        date_to = params.get('date_to')
        order_number = params.get('order_number')

        if status:
            queryset = queryset.filter(status=status)
        if payment_status:
            queryset = queryset.filter(payment_status=payment_status)
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)
        if order_number:
            queryset = queryset.filter(order_number__icontains=order_number)

        return queryset

    def paginate_queryset(self, queryset):
        """
        Si ?no_pagination=true est passé (utilisé par la trésorerie pour tout récupérer),
        on désactive la pagination et on retourne toutes les commandes.
        """
        if self.request.query_params.get('no_pagination', '').lower() == 'true':
            return None
        return super().paginate_queryset(queryset)

    def perform_create(self, serializer):
        from django.utils import timezone
        from products.models import Product
        from django.db import transaction
        from accounts.email_utils import send_order_confirmation_email

        with transaction.atomic():
            order = serializer.save(user=self.request.user)

            for item_data in order.items.all():
                try:
                    product = Product.objects.select_for_update().get(product_id=item_data.product_id)
                    print(f'[ORDER CREATE] Product: {product.name}, Stock before: {product.stock}, Ordered: {item_data.quantity}')
                    if product.stock >= item_data.quantity:
                        product.stock = product.stock - item_data.quantity
                        product.save()
                        print(f'[ORDER CREATE] Stock after: {product.stock}')
                    else:
                        print(f'[ORDER CREATE] WARNING: Insufficient stock for {product.name}. Available: {product.stock}, Ordered: {item_data.quantity}')
                except Product.DoesNotExist:
                    print(f'[ORDER CREATE] WARNING: Product ID {item_data.product_id} not found')

            year = timezone.now().strftime('%y')
            year_start = timezone.datetime(int('20' + year), 1, 1, 0, 0, 0, 0)
            order_count = Order.objects.filter(created_at__gte=year_start).count()
            order.order_number = f"CPS{year}{order_count:06d}"
            order.save()

            if not order.tracking_number:
                order.tracking_number = f"TRK-{order.id:06d}"
                order.save()

        try:
            send_order_confirmation_email(order)
        except Exception as e:
            print(f'[ORDER CREATE] Failed to send confirmation email: {str(e)}')


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all().order_by('-date_commande')
    serializer_class = PurchaseOrderSerializer


class DeliveryViewSet(viewsets.ModelViewSet):
    queryset = Delivery.objects.all()
    serializer_class = DeliverySerializer
    permission_classes = [IsAdminOrSales]


@api_view(['POST'])
@perm_classes([IsAuthenticated])
def upload_payment_image(request, pk):
    """
    POST /orders/<id>/upload-payment-image/
    Champs attendus (multipart/form-data):
      - image_type : "transfer" | "cheque" | "lettre"
      - image      : le fichier image
    """
    import os
    from django.conf import settings as django_settings
    from django.core.files.storage import FileSystemStorage

    try:
        order = Order.objects.get(pk=pk)
    except Order.DoesNotExist:
        return Response({'error': 'Commande introuvable.'}, status=404)

    user = request.user
    if not (user.is_staff or user.is_superuser or getattr(user, 'role', None) in ('admin', 'sales')):
        return Response({'error': 'Non autorisé.'}, status=403)

    image_type = request.data.get('image_type')
    if image_type not in ('transfer', 'cheque', 'lettre'):
        return Response({'error': 'image_type invalide. Valeurs acceptées : transfer, cheque, lettre.'}, status=400)

    image_file = request.FILES.get('image')
    if not image_file:
        return Response({'error': 'Aucun fichier image fourni.'}, status=400)

    upload_dir = os.path.join(django_settings.MEDIA_ROOT, 'orders', 'payment_images')
    os.makedirs(upload_dir, exist_ok=True)

    ext = os.path.splitext(image_file.name)[1]
    unique_name = f'order_{pk}_{image_type}_{uuid.uuid4().hex}{ext}'
    fs = FileSystemStorage(location=upload_dir)
    saved_name = fs.save(unique_name, image_file)

    media_url = getattr(django_settings, 'MEDIA_URL', '/media/')
    file_url = f'{media_url}orders/payment_images/{saved_name}'

    if image_type == 'transfer':
        order.transfer_image = f'orders/payment_images/{saved_name}'
    elif image_type == 'cheque':
        order.cheque_image = f'orders/payment_images/{saved_name}'
    elif image_type == 'lettre':
        order.lettre_image = f'orders/payment_images/{saved_name}'
    order.save()

    return Response({'message': 'Image uploadée avec succès.', 'url': file_url})


@api_view(['GET'])
@perm_classes([IsAuthenticated])
def get_cri_balance(request):
    """Get the current user's CRI (loan) balance from previous orders."""
    balance_obj, _ = CRIBalance.objects.get_or_create(user=request.user)
    return Response({'balance': float(balance_obj.balance), 'updated_at': balance_obj.updated_at})
