from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

class Product(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    old_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    image = models.ImageField(upload_to='products/', blank=True)
    brand = models.CharField(max_length=100)
    size = models.CharField(max_length=50)  # Ex: 205/55R16
    season = models.CharField(max_length=20, choices=[
        ('summer', 'Été'),
        ('winter', 'Hiver'),
        ('all_season', 'Toutes saisons')
    ])
    stock = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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
