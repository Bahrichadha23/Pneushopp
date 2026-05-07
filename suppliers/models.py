from django.db import models


class Supplier(models.Model):
    STATUS_CHOICES = [
        ('active', 'Actif'),
        ('inactive', 'Inactif'),
    ]

    name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    specialties = models.JSONField(default=list, blank=True)
    rating = models.IntegerField(default=0)
    orders_count = models.IntegerField(default=0)
    delivery_time = models.CharField(max_length=50, default='7', blank=True, help_text='Délai de livraison (ex: 3-5 jours)')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    def __str__(self):
        return self.name
