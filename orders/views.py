import uuid
from rest_framework import generics, permissions, viewsets
from rest_framework.decorators import api_view, permission_classes as perm_classes
from rest_framework.response import Response
from .models import Delivery, Order, PurchaseOrder, CRIBalance, Avoir
from .serializers import DeliverySerializer, OrderSerializer, PurchaseOrderSerializer, AvoirSerializer
from rest_framework.permissions import IsAuthenticated
from accounts.permanent_permissions import IsAdmin, IsAdminOrSales, IsAdminOrSalesOrOwner


class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Order.objects.all().prefetch_related('items').select_related('user')
    serializer_class = OrderSerializer
    permission_classes = [IsAdminOrSalesOrOwner]

    def perform_update(self, serializer):
        from accounts.email_utils import send_order_status_update_email, send_delivery_invoice_email
        from decimal import Decimal
        old_order = self.get_object()
        old_status = old_order.status
        old_delivery_cost = old_order.delivery_cost or Decimal('0')

        order = serializer.save()

        # Si les frais de livraison ont changé → recalculer le total_amount
        new_delivery_cost = order.delivery_cost or Decimal('0')
        if new_delivery_cost != old_delivery_cost:
            # total_amount = montant produits + nouveaux frais de livraison
            items_total = sum(
                item.unit_price * item.quantity for item in order.items.all()
            )
            order.total_amount = items_total + new_delivery_cost
            order.save(update_fields=['total_amount'])

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
        from accounts.email_utils import send_order_confirmation_email, send_new_order_notification_email

        with transaction.atomic():
            order = serializer.save(user=self.request.user)

            for item_data in order.items.all():
                try:
                    product = Product.objects.select_for_update().get(pk=item_data.product_id)
                    print(f'[ORDER CREATE] Product: {product.name}, Stock before: {product.stock}, Ordered: {item_data.quantity}')
                    if product.stock >= item_data.quantity:
                        product.stock = product.stock - item_data.quantity
                        product.save()
                        print(f'[ORDER CREATE] Stock after: {product.stock}')
                    else:
                        print(f'[ORDER CREATE] WARNING: Insufficient stock for {product.name}. Available: {product.stock}, Ordered: {item_data.quantity}')
                except Product.DoesNotExist:
                    print(f'[ORDER CREATE] WARNING: Product ID {item_data.product_id} not found')

            if not order.tracking_number:
                order.tracking_number = f"TRK-{order.id:06d}"
                order.save()

        try:
            send_order_confirmation_email(order)
        except Exception as e:
            print(f'[ORDER CREATE] Failed to send confirmation email: {str(e)}')

        try:
            send_new_order_notification_email(order)
        except Exception as e:
            print(f'[ORDER CREATE] Failed to send sales notification email: {str(e)}')


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all().order_by('-date_commande')
    serializer_class = PurchaseOrderSerializer


class DeliveryViewSet(viewsets.ModelViewSet):
    queryset = Delivery.objects.all()
    serializer_class = DeliverySerializer
    permission_classes = [IsAdminOrSales]

    def perform_update(self, serializer):
        instance = serializer.save()
        # Synchroniser date_livraison → date_livraison_prevue sur la commande et le bon de commande
        if instance.date_livraison:
            if instance.order_id:
                Order.objects.filter(pk=instance.order_id).update(
                    date_livraison_prevue=instance.date_livraison
                )
            if instance.purchase_order_id:
                PurchaseOrder.objects.filter(pk=instance.purchase_order_id).update(
                    date_livraison_prevue=instance.date_livraison
                )


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
    is_staff = user.is_staff or user.is_superuser or getattr(user, 'role', None) in ('admin', 'sales')
    is_owner = order.user == user
    if not (is_staff or is_owner):
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


def _serialize_claim(claim, request):
    """Return a dict representation of a WarrantyClaim."""
    STATUS_LABELS = {
        'pending': 'En attente',
        'processing': 'En traitement',
        'resolved': 'Résolu',
        'rejected': 'Rejeté',
    }

    def build_url(field):
        try:
            if field and field.name:
                return request.build_absolute_uri(field.url)
        except Exception:
            pass
        return None

    tire_image_urls = []
    for img in claim.tire_images.all():
        url = build_url(img.image)
        if url:
            tire_image_urls.append(url)

    return {
        'id': claim.id,
        'order_ref': claim.order_ref,
        'invoice_number': claim.invoice_number,
        'order_item_name': claim.order_item_name,
        'first_name': claim.first_name,
        'last_name': claim.last_name,
        'email': claim.email,
        'description': claim.description,
        'mileage_at_purchase': claim.mileage_at_purchase,
        'current_mileage': claim.current_mileage,
        'status': claim.status,
        'status_label': STATUS_LABELS.get(claim.status, claim.status),
        'admin_notes': claim.admin_notes,
        'invoice_photo_url': build_url(claim.invoice_photo),
        'tire_video_url': build_url(claim.tire_video),
        'tire_image_urls': tire_image_urls,
        'created_at': claim.created_at.isoformat(),
        'updated_at': claim.updated_at.isoformat(),
    }


@api_view(['POST', 'GET'])
@perm_classes([IsAuthenticated])
def warranty_claim_view(request):
    """
    POST /api/orders/sav/  — submit a new SAV claim (multipart/form-data)
    GET  /api/orders/sav/  — admin: list all claims
    """
    from .models import WarrantyClaim, WarrantyClaimTireImage
    from accounts.permanent_permissions import IsAdminOrSales

    if request.method == 'GET':
        is_admin = (
            request.user.is_staff or request.user.is_superuser
            or getattr(request.user, 'role', None) in ('admin', 'sales')
        )
        if not is_admin:
            return Response({'error': 'Non autorisé'}, status=403)
        claims = (
            WarrantyClaim.objects
            .prefetch_related('tire_images')
            .order_by('-created_at')
        )
        return Response([_serialize_claim(c, request) for c in claims])

    # POST — create claim
    data = request.data
    files = request.FILES

    order_id = data.get('order')
    if not order_id:
        return Response({'error': 'order requis'}, status=400)

    try:
        order = Order.objects.get(pk=order_id, user=request.user)
    except Order.DoesNotExist:
        return Response({'error': 'Commande introuvable'}, status=404)

    claim = WarrantyClaim(
        order=order,
        order_item_id=data.get('order_item_id') or None,
        order_item_name=data.get('order_item_name', ''),
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', ''),
        email=data.get('email', ''),
        order_ref=data.get('order_ref', ''),
        invoice_number=data.get('invoice_number', ''),
        mileage_at_purchase=data.get('mileage_at_purchase', ''),
        current_mileage=data.get('current_mileage', ''),
        description=data.get('description', ''),
        created_by=request.user,
    )
    if 'invoice_photo' in files:
        claim.invoice_photo = files['invoice_photo']
    if 'tire_video' in files:
        claim.tire_video = files['tire_video']
    claim.save()

    for img_file in files.getlist('tire_images'):
        WarrantyClaimTireImage.objects.create(claim=claim, image=img_file)

    return Response(_serialize_claim(claim, request), status=201)


@api_view(['GET'])
@perm_classes([IsAuthenticated])
def mes_reclamations(request):
    """GET /api/orders/sav/mes-reclamations/ — list claims of the authenticated user."""
    from .models import WarrantyClaim
    claims = (
        WarrantyClaim.objects
        .filter(created_by=request.user)
        .prefetch_related('tire_images')
        .order_by('-created_at')
    )
    return Response([_serialize_claim(c, request) for c in claims])


@api_view(['GET', 'PATCH'])
@perm_classes([IsAuthenticated])
def warranty_claim_detail_view(request, pk):
    """
    GET   /api/orders/sav/<pk>/  — get one claim (owner or admin)
    PATCH /api/orders/sav/<pk>/  — admin: update status / admin_notes
    """
    from .models import WarrantyClaim
    try:
        claim = WarrantyClaim.objects.prefetch_related('tire_images').get(pk=pk)
    except WarrantyClaim.DoesNotExist:
        return Response({'error': 'Réclamation introuvable'}, status=404)

    is_admin = (
        request.user.is_staff or request.user.is_superuser
        or getattr(request.user, 'role', None) in ('admin', 'sales')
    )
    is_owner = claim.created_by == request.user
    if not (is_admin or is_owner):
        return Response({'error': 'Non autorisé'}, status=403)

    if request.method == 'PATCH':
        if not is_admin:
            return Response({'error': 'Non autorisé'}, status=403)
        if 'status' in request.data:
            claim.status = request.data['status']
        if 'admin_notes' in request.data:
            claim.admin_notes = request.data['admin_notes']
        claim.save()

    return Response(_serialize_claim(claim, request))


class AvoirListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/orders/avoirs/        → liste des avoirs
    POST /api/orders/avoirs/        → créer un avoir + remettre en stock
    """
    serializer_class = AvoirSerializer
    permission_classes = [IsAdminOrSales]

    def get_queryset(self):
        return Avoir.objects.prefetch_related('items').select_related('created_by', 'original_order').order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AvoirDetailView(generics.RetrieveAPIView):
    """GET /api/orders/avoirs/<id>/"""
    queryset = Avoir.objects.prefetch_related('items').select_related('created_by', 'original_order')
    serializer_class = AvoirSerializer
    permission_classes = [IsAdminOrSales]


@api_view(['GET'])
@perm_classes([IsAdminOrSales])
def search_order_for_avoir(request):
    """
    GET /api/orders/avoirs/search/?q=CPS26000001
    Cherche une commande par numéro pour préparer un avoir.
    """
    q = request.query_params.get('q', '').strip()
    if not q:
        return Response({'error': 'Paramètre q requis.'}, status=400)

    order = Order.objects.filter(order_number__icontains=q).prefetch_related('items').select_related('user').first()
    if not order:
        return Response({'error': 'Commande introuvable.'}, status=404)

    return Response({
        'id': order.id,
        'order_number': order.order_number,
        'created_at': order.created_at,
        'total_amount': str(order.total_amount),
        'client_name': order.user.get_full_name() or order.user.email,
        'client_email': order.user.email,
        'items': [
            {
                'id': item.id,
                'product_id': item.product_id,
                'product_name': item.product_name,
                'quantity': item.quantity,
                'unit_price': str(item.unit_price),
                'total_price': str(item.total_price),
            }
            for item in order.items.all()
        ]
    })
