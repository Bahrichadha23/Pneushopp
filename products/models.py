import uuid
from django.db import models
from django.contrib.auth import get_user_model
from decimal import Decimal

User = get_user_model()


class Category(models.Model):
    name = models.CharField('Nom', max_length=255)
    slug = models.SlugField('Slug', unique=True)
    description = models.TextField('Description', blank=True, null=True)
    created_at = models.DateTimeField('Créé le', auto_now_add=True)

    class Meta:
        verbose_name = 'Catégorie'
        verbose_name_plural = 'Catégories'

    def __str__(self):
        return self.name


class Product(models.Model):
    SEASON_CHOICES = [
        ('summer', 'Été'),
        ('winter', 'Hiver'),
        ('all_season', '4 saisons'),
    ]

    name = models.CharField('Nom', max_length=255, blank=True)
    slug = models.SlugField('Slug', max_length=255, blank=True, null=True)
    description = models.TextField('Description', blank=True)
    price = models.DecimalField('Prix', max_digits=10, decimal_places=3)
    old_price = models.DecimalField('Ancien prix', max_digits=10, decimal_places=3, null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products', verbose_name='Catégorie', null=True, blank=True)
    image = models.URLField('Image principale', blank=True, null=True)
    image_2 = models.URLField('Image 2', blank=True, null=True)
    image_3 = models.URLField('Image 3', blank=True, null=True)
    brand = models.CharField('Marque', max_length=100, blank=True)
    size = models.CharField('Taille', max_length=50, blank=True)
    season = models.CharField('Saison', max_length=20, choices=SEASON_CHOICES, blank=True)
    stock = models.PositiveIntegerField('Stock', default=0)
    stock_min = models.PositiveIntegerField('Stock minimum (alerte)', default=5)
    stock_max = models.PositiveIntegerField('Stock maximum', default=100)
    is_featured = models.BooleanField('Mis en avant', default=False)
    is_active = models.BooleanField('Actif', default=True)
    created_at = models.DateTimeField('Créé le', auto_now_add=True)
    updated_at = models.DateTimeField('Modifié le', auto_now=True)
    reference = models.CharField('Référence', max_length=100, blank=True)
    designation = models.CharField('Désignation', max_length=255, blank=True)
    type = models.CharField('Type', max_length=100, blank=True)
    emplacement = models.CharField('Emplacement', max_length=100, blank=True, null=True)
    fabrication_date = models.DateField('Date de fabrication', null=True, blank=True)

    class Meta:
        verbose_name = 'Produit'
        verbose_name_plural = 'Produits'

    def __str__(self):
        return f'{self.brand} - {self.name} - {self.size}'

    @property
    def is_on_sale(self):
        return bool(self.old_price and self.old_price > self.price)

    @property
    def discount_percentage(self):
        if self.is_on_sale:
            return int((1 - self.price / self.old_price) * 100)
        return 0


class Order(models.Model):
    ORDER_STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('confirmed', 'Confirmée'),
        ('processing', 'En traitement'),
        ('shipped', 'Expédiée'),
        ('delivered', 'Livrée'),
        ('cancelled', 'Annulée'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders', verbose_name='Utilisateur')
    order_number = models.CharField('Numéro de commande', max_length=50, blank=True)
    status = models.CharField('Statut', max_length=20, choices=ORDER_STATUS_CHOICES, default='pending')
    total_amount = models.DecimalField('Montant total', max_digits=10, decimal_places=3, default=0)
    shipping_address = models.TextField('Adresse de livraison', blank=True)
    notes = models.TextField('Notes', blank=True)
    created_at = models.DateTimeField('Créé le', auto_now_add=True)
    updated_at = models.DateTimeField('Modifié le', auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Commande'
        verbose_name_plural = 'Commandes'

    def save(self, *args, **kwargs):
        if not self.pk and not self.order_number:
            from django.utils import timezone
            year = timezone.now().strftime('%y')
            year_start = timezone.now().replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            order_count = Order.objects.filter(created_at__gte=year_start).count()
            self.order_number = f'CPS{year}{order_count:06d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'Commande {self.order_number} - {self.user.email}'

    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items', verbose_name='Commande')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name='Produit')
    quantity = models.PositiveIntegerField('Quantité', default=1)
    price = models.DecimalField('Prix', max_digits=10, decimal_places=3)
    created_at = models.DateTimeField('Créé le', auto_now_add=True)

    class Meta:
        verbose_name = 'Article de commande'
        verbose_name_plural = 'Articles de commande'

    def __str__(self):
        return f'{self.product.name} - Commande {self.order.order_number}'

    @property
    def total_price(self):
        return self.price * self.quantity


class StockMovement(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='movements')
    product_name = models.CharField(max_length=255, blank=True)
    type = models.CharField(max_length=20)
    quantity = models.IntegerField()
    reason = models.CharField(max_length=255, blank=True)
    reference = models.CharField(max_length=100, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Mouvement de stock'
        verbose_name_plural = 'Mouvements de stock'

    def __str__(self):
        return f'{self.quantity} x {self.product_name or self.product.name}'


class SiteSettings(models.Model):
    nom_boutique = models.CharField(max_length=255, default='PneuShop Tunisia')
    description = models.TextField(default='Votre spécialiste en pneumatiques')
    adresse = models.TextField(default='Avenue Habib Bourguiba, Tunis')
    telephone = models.CharField(max_length=20, default='+216 71 123 456')
    email = models.EmailField(default='contact@pneushop.tn')
    horaires = models.CharField(max_length=255, default='Lun-Sam: 8h-18h')
    email_commandes = models.BooleanField(default=True)
    email_stock = models.BooleanField(default=True)
    sms_clients = models.BooleanField(default=False)
    push_admin = models.BooleanField(default=True)
    session_timeout = models.PositiveIntegerField(default=30)
    mot_de_passe_force = models.BooleanField(default=True)
    authentification_double = models.BooleanField(default=False)
    journalisation = models.BooleanField(default=True)
    maintenance_mode = models.BooleanField(default=False)
    sauvegarde_auto = models.BooleanField(default=True)
    langue_principale = models.CharField(max_length=10, default='fr')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Paramètres du site'

    def __str__(self):
        return self.nom_boutique


class ImportJob(models.Model):
    STATUS_CHOICES = [
        ('queued', 'En attente'),
        ('running', 'En cours'),
        ('done', 'Terminé'),
        ('failed', 'Échoué'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='queued')
    original_filename = models.CharField(max_length=255, blank=True)
    file_path = models.CharField(max_length=500, blank=True)
    total_rows = models.PositiveIntegerField(default=0)
    created_count = models.PositiveIntegerField(default=0)
    error_count = models.PositiveIntegerField(default=0)
    images_processed = models.BooleanField(default=False)
    errors = models.JSONField(default=list)
    message = models.TextField(blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Import Job'
        verbose_name_plural = 'Import Jobs'

    def __str__(self):
        return f'{self.original_filename} ({self.status})'
