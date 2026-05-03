from django.db import models
from django.contrib.auth import get_user_model
from suppliers.models import Supplier
from products.models import Product

User = get_user_model()


class PurchaseOrder(models.Model):
    """
    COMPANY PURCHASE ORDER - Buying FROM Suppliers

    CRITICAL DIFFERENCE:
    - orders.Order: Company SELLS TO clients → stock DECREASES
    - purchases.PurchaseOrder: Company BUYS FROM suppliers → stock INCREASES
    """
    STATUS_CHOICES = [
        ('draft', 'Brouillon'),
        ('confirmed', 'Confirmée'),
        ('received', 'Reçue'),
        ('cancelled', 'Annulée'),
    ]

    order_number = models.CharField('Numéro de commande', max_length=50, unique=True)
    invoice_number = models.CharField('Numéro de facture', max_length=100, blank=True, null=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name='purchase_orders', verbose_name='Fournisseur')
    note = models.TextField('Note', blank=True, null=True)
    week = models.CharField('Semaine', max_length=10, blank=True, null=True)
    year = models.CharField('Année', max_length=10, blank=True, null=True)
    subtotal = models.DecimalField('Sous-total', max_digits=12, decimal_places=3, default=0)
    global_discount = models.DecimalField('Remise globale (%)', max_digits=5, decimal_places=2, default=0)
    total = models.DecimalField('Total HT', max_digits=12, decimal_places=3, default=0)
    status = models.CharField('Statut', max_length=20, choices=STATUS_CHOICES, default='draft')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_purchases', verbose_name='Créé par')
    order_date = models.DateTimeField('Date de commande', auto_now_add=True)
    confirmed_date = models.DateTimeField('Date de confirmation', null=True, blank=True)
    received_date = models.DateTimeField('Date de réception', null=True, blank=True)
    updated_at = models.DateTimeField('Modifié le', auto_now=True)

    class Meta:
        verbose_name = 'Bon de Commande Fournisseur'
        verbose_name_plural = 'Bons de Commande Fournisseurs'
        ordering = ['-order_date']

    def __str__(self):
        return f'Achat #{self.order_number} - {self.supplier.name}'

    def save(self, *args, **kwargs):
        if not self.order_number:
            from django.utils import timezone
            now = timezone.now()
            count = PurchaseOrder.objects.filter(
                order_date__year=now.year,
                order_date__month=now.month,
            ).count()
            self.order_number = f'ACH-{now.month:02d}{now.year}-{count:04d}'
        super().save(*args, **kwargs)


class PurchaseOrderItem(models.Model):
    """
    Individual items in a purchase order
    """
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items', verbose_name='Bon de commande')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='purchase_items', verbose_name='Produit', null=True, blank=True)
    reference = models.CharField('Référence', max_length=100)
    designation = models.CharField('Désignation', max_length=255)
    unit_price_ht = models.DecimalField('Prix unitaire HT', max_digits=10, decimal_places=3)
    quantity = models.PositiveIntegerField('Quantité', default=1)
    discount = models.DecimalField('Remise (%)', max_digits=5, decimal_places=2, default=0)
    total_ht = models.DecimalField('Total HT', max_digits=12, decimal_places=3, default=0)
    received_quantity = models.PositiveIntegerField('Quantité reçue', default=0)
    created_at = models.DateTimeField('Créé le', auto_now_add=True)

    class Meta:
        verbose_name = 'Article de commande'
        verbose_name_plural = 'Articles de commande'

    def __str__(self):
        return f'{self.reference} - {self.designation} (x{self.quantity}'

    def save(self, *args, **kwargs):
        base = self.unit_price_ht * self.quantity
        self.total_ht = base * (1 - self.discount / 100)
        super().save(*args, **kwargs)
