from django.db import models
from django.contrib.auth import get_user_model
from decimal import Decimal

User = get_user_model()

class Category(models.Model):
    name = models.CharField(max_length=100, verbose_name="Nom")
    slug = models.SlugField(unique=True, verbose_name="Slug")
    description = models.TextField(blank=True, verbose_name="Description")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")

    class Meta:
        verbose_name = "Catégorie"
        verbose_name_plural = "Catégories"

    def __str__(self):
        return self.name

class Product(models.Model):
    name = models.CharField(max_length=200, verbose_name="Nom")
    slug = models.SlugField(unique=True, verbose_name="Slug")
    description = models.TextField(verbose_name="Description")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Prix")
    old_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Ancien prix")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products', verbose_name="Catégorie")
    image = models.ImageField(upload_to='products/', blank=True, verbose_name="Image")
    brand = models.CharField(max_length=100, verbose_name="Marque")
    size = models.CharField(max_length=50, verbose_name="Taille")  # Ex: 205/55R16
    season = models.CharField(max_length=20, choices=[
        ('summer', 'Été'),
        ('winter', 'Hiver'),
        ('all_season', 'Toutes saisons')
    ], verbose_name="Saison")
    stock = models.PositiveIntegerField(default=0, verbose_name="Stock")
    is_featured = models.BooleanField(default=False, verbose_name="Mis en avant")
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Modifié le")

    class Meta:
        verbose_name = "Produit"
        verbose_name_plural = "Produits"

    def __str__(self):
        return f"{self.brand} {self.name} - {self.size}"

    @property
    def is_on_sale(self):
        return self.old_price and self.old_price > self.price

    @property
    def discount_percentage(self):
        if self.is_on_sale:
            return int(((self.old_price - self.price) / self.old_price) * 100)
        return 0


class Order(models.Model):
    ORDER_STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('processing', 'En cours de traitement'),
        ('shipped', 'Expédié'),
        ('delivered', 'Livré'),
        ('completed', 'Terminé'),
        ('cancelled', 'Annulé'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders', verbose_name="Utilisateur")
    order_number = models.CharField(max_length=50, unique=True, blank=True, verbose_name="Numéro de commande")
    status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='pending', verbose_name="Statut")
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Montant total")
    shipping_address = models.TextField(verbose_name="Adresse de livraison")
    notes = models.TextField(blank=True, verbose_name="Notes")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Modifié le")
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Commande"
        verbose_name_plural = "Commandes"
    
    def save(self, *args, **kwargs):
        if not self.order_number and not self.pk:
            # For new orders, save first to get pk, then update order number
            super().save(*args, **kwargs)
            self.order_number = f'PN-{self.pk:06d}'
            # Use update to avoid recursion
            Order.objects.filter(pk=self.pk).update(order_number=self.order_number)
        elif not self.order_number and self.pk:
            # Already has pk but no order number
            self.order_number = f'PN-{self.pk:06d}'
            super().save(*args, **kwargs)
        else:
            super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Commande {self.order_number} - {self.user.email}"
    
    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items', verbose_name="Commande")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name="Produit")
    quantity = models.PositiveIntegerField(verbose_name="Quantité")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Prix")  # Price at time of order
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    
    class Meta:
        verbose_name = "Article de commande"
        verbose_name_plural = "Articles de commande"
    
    def __str__(self):
        return f"{self.quantity}x {self.product.name} - Commande {self.order.order_number}"
    
    @property
    def total_price(self):
        return self.quantity * self.price
