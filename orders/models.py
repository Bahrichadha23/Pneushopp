import os
from django.db import models
from django.conf import settings


def _sav_storage():
    """Use Cloudinary so SAV files are stored on the CDN, not on the server filesystem."""
    from cloudinary_storage.storage import MediaCloudinaryStorage
    return MediaCloudinaryStorage()


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    PAYMENT_STATUS = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='user_orders')
    order_number = models.CharField(max_length=50, unique=True, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=3)
    delivery_cost = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    shipping_address = models.JSONField(default=dict)
    billing_address = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    tracking_number = models.CharField(max_length=100, blank=True, null=True)

    # Warranty
    warranty_accepted = models.BooleanField(default=False)
    warranty_vehicle_registration = models.CharField(max_length=100, blank=True, null=True)
    warranty_vehicle_mileage = models.CharField(max_length=50, blank=True, null=True)

    # CRI (loan) payment
    cri_amount_paid = models.DecimalField(max_digits=10, decimal_places=3, default=0, help_text='Amount paid now via CRI')
    cri_remaining = models.DecimalField(max_digits=10, decimal_places=3, default=0, help_text='Remaining unpaid amount (loan)')
    cri_remarque = models.TextField(blank=True, null=True, help_text='CRI payment note')

    # Transfer payment
    transfer_number = models.CharField(max_length=100, blank=True, null=True)
    transfer_holder_name = models.CharField(max_length=255, blank=True, null=True)
    transfer_bank_name = models.CharField(max_length=255, blank=True, null=True)
    transfer_image_name = models.CharField(max_length=255, blank=True, null=True)
    transfer_image = models.CharField(max_length=500, blank=True, null=True)
    transfer_amount_paid = models.DecimalField(max_digits=10, decimal_places=3, default=0, blank=True, null=True)
    transfer_remaining = models.DecimalField(max_digits=10, decimal_places=3, default=0, blank=True, null=True)
    transfer_remarque = models.TextField(blank=True, null=True)

    # Lettre de change
    lettre_number = models.CharField(max_length=100, blank=True, null=True)
    lettre_date = models.DateField(blank=True, null=True)
    lettre_name = models.CharField(max_length=255, blank=True, null=True)
    lettre_bank_name = models.CharField(max_length=255, blank=True, null=True)
    lettre_rib = models.CharField(max_length=100, blank=True, null=True)
    lettre_lieu = models.CharField(max_length=255, blank=True, null=True)
    lettre_image_name = models.CharField(max_length=255, blank=True, null=True)
    lettre_image = models.CharField(max_length=500, blank=True, null=True)
    lettre_amount_paid = models.DecimalField(max_digits=10, decimal_places=3, default=0, blank=True, null=True)
    lettre_remaining = models.DecimalField(max_digits=10, decimal_places=3, default=0, blank=True, null=True)
    lettre_remarque = models.TextField(blank=True, null=True)

    # Chèque
    cheque_number = models.CharField(max_length=100, blank=True, null=True)
    cheque_date = models.DateField(blank=True, null=True)
    cheque_name = models.CharField(max_length=255, blank=True, null=True)
    cheque_bank_name = models.CharField(max_length=255, blank=True, null=True)
    cheque_image_name = models.CharField(max_length=255, blank=True, null=True)
    cheque_image = models.CharField(max_length=500, blank=True, null=True)
    cheque_amount_paid = models.DecimalField(max_digits=10, decimal_places=3, default=0, blank=True, null=True)
    cheque_remaining = models.DecimalField(max_digits=10, decimal_places=3, default=0, blank=True, null=True)
    cheque_remarque = models.TextField(blank=True, null=True)

    # COD (Cash on delivery)
    cod_authorization_number = models.CharField(max_length=100, blank=True, null=True)
    cod_bank_name = models.CharField(max_length=255, blank=True, null=True)
    cod_amount_paid = models.DecimalField(max_digits=10, decimal_places=3, default=0, blank=True, null=True)
    cod_remaining = models.DecimalField(max_digits=10, decimal_places=3, default=0, blank=True, null=True)
    cod_remarque = models.TextField(blank=True, null=True)

    # Especes (cash)
    especes_amount_paid = models.DecimalField(max_digits=10, decimal_places=3, default=0, blank=True, null=True)
    especes_remaining = models.DecimalField(max_digits=10, decimal_places=3, default=0, blank=True, null=True)
    especes_remarque = models.TextField(blank=True, null=True)

    commercial = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f'{self.order_number} - {self.user.email}'


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product_name = models.CharField(max_length=255)
    product_id = models.CharField(max_length=100, blank=True, null=True)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=3)
    total_price = models.DecimalField(max_digits=10, decimal_places=3)
    discount = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='Discount percentage (0-100)')
    specifications = models.JSONField(default=dict)

    def __str__(self):
        return f'{self.product_name} x {self.quantity}'


class Avoir(models.Model):
    """Credit note / return document"""
    avoir_number = models.CharField(max_length=50, unique=True, blank=True)
    original_order = models.ForeignKey(
        Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='avoirs'
    )
    original_invoice_number = models.CharField(max_length=100, blank=True, null=True)
    reason = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='avoirs_created'
    )

    def __str__(self):
        return f'{self.avoir_number} — {self.original_invoice_number}'


class AvoirItem(models.Model):
    avoir = models.ForeignKey(Avoir, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(
        'products.Product', on_delete=models.SET_NULL, null=True, blank=True
    )
    product_name = models.CharField(max_length=255)
    product_reference = models.CharField(max_length=100, blank=True)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=3)
    total_price = models.DecimalField(max_digits=10, decimal_places=3)

    def __str__(self):
        return f'{self.product_name} x {self.quantity}'


class PurchaseOrder(models.Model):
    """Legacy PurchaseOrder attached to a client order (not supplier)"""
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('confirmé', 'Confirmé'),
        ('livré', 'Livré'),
    ]
    PRIORITE_CHOICES = [
        ('normale', 'Normale'),
        ('urgent', 'Urgent'),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='purchase_orders', null=True, blank=True)
    date_commande = models.DateField()
    date_livraison_prevue = models.DateField(null=True, blank=True)
    total_ht = models.DecimalField(max_digits=10, decimal_places=3)
    total_ttc = models.DecimalField(max_digits=10, decimal_places=3)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    priorite = models.CharField(max_length=20, choices=PRIORITE_CHOICES, default='normale')
    # Frontend sends: supplier, articles, week, year, invoice_number, dot
    supplier = models.IntegerField(null=True, blank=True)
    invoice_number = models.CharField(max_length=100, blank=True, null=True)
    week = models.CharField(max_length=10, blank=True, null=True)
    year = models.CharField(max_length=10, blank=True, null=True)
    dot = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f'PO-{self.id} - {self.date_commande}'


class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='articles')
    nom = models.CharField(max_length=255)
    quantite = models.PositiveIntegerField()
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=3)

    def __str__(self):
        return f'{self.nom} {self.quantite}'


class Delivery(models.Model):
    STATUT_CHOICES = [
        ('prepare', 'En préparation'),
        ('en_route', 'En route'),
        ('livre', 'Livré'),
    ]

    purchase_order = models.ForeignKey('PurchaseOrder', on_delete=models.CASCADE, related_name='deliveries', null=True, blank=True)
    order = models.ForeignKey('Order', on_delete=models.CASCADE, related_name='deliveries', null=True, blank=True)
    client = models.CharField(max_length=255)
    adresse = models.TextField()
    transporteur = models.CharField(max_length=255)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='prepare')
    date_expedition = models.DateField(null=True, blank=True)
    date_livraison = models.DateField(null=True, blank=True)
    colis = models.IntegerField(default=1)
    numero_suivi = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        if self.purchase_order:
            return f'Delivery {self.id} for PO {self.purchase_order.id}'
        if self.order:
            return f'Delivery {self.id} for Order {self.order.id}'
        return f'Delivery {self.id}'


class CRIBalance(models.Model):
    """Tracks cumulative CRI (loan) balance per user."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cri_balance')
    balance = models.DecimalField(max_digits=10, decimal_places=3, default=0, help_text='Total unpaid CRI amount carried over from previous orders')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'CRI Balance: {self.user.email} - {self.balance} DT'


class WarrantyClaim(models.Model):
    """Service Apres Vente - reclamation client sous garantie"""
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('processing', 'En traitement'),
        ('resolved', 'Resolu'),
        ('rejected', 'Rejete'),
    ]

    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='warranty_claims')
    order_item_id = models.IntegerField(null=True, blank=True)
    order_item_name = models.CharField(max_length=255, blank=True)

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    order_ref = models.CharField(max_length=100)
    invoice_number = models.CharField(max_length=100, blank=True)

    mileage_at_purchase = models.CharField(max_length=50, blank=True)
    current_mileage = models.CharField(max_length=50, blank=True)

    description = models.TextField(blank=True)

    invoice_photo = models.FileField(upload_to='sav/invoices/', blank=True, null=True, storage=_sav_storage)
    tire_video = models.FileField(upload_to='sav/videos/', blank=True, null=True, storage=_sav_storage)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='warranty_claims'
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'SAV-{self.id:04d} - {self.order_ref} - {self.first_name} {self.last_name}'


class WarrantyClaimTireImage(models.Model):
    """One of potentially many tire photos attached to a SAV claim."""
    claim = models.ForeignKey(
        WarrantyClaim, on_delete=models.CASCADE, related_name='tire_images'
    )
    image = models.FileField(
        upload_to='sav/tire_images/', storage=_sav_storage
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'TireImage {self.id} — SAV-{self.claim_id:04d}'
