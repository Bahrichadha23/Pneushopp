from django.conf import settings
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_verified', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('customer', 'Client'),
        ('sales', 'Responsable Ventes'),
        ('purchasing', 'Responsable Achats'),
        ('responsable_achats', 'Responsable Achats'),
        ('admin', 'Administrateur'),
    ]

    email = models.EmailField('Email', unique=True)
    phone = models.CharField('Téléphone', max_length=20, blank=True)
    address = models.TextField('Adresse', blank=True)
    is_verified = models.BooleanField('Vérifié', default=False)
    verification_code = models.CharField('Code de vérification', max_length=6, blank=True)
    role = models.CharField('role', max_length=30, choices=ROLE_CHOICES, default='customer')
    plain_password = models.CharField('Mot de passe (visible admin)', max_length=255, blank=True, default='')
    created_at = models.DateTimeField('Créé le', auto_now_add=True)
    updated_at = models.DateTimeField('Modifié le', auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    objects = CustomUserManager()

    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return self.email


class UserActivityLog(models.Model):
    ACTION_CHOICES = [
        ('login', 'Connexion'),
        ('create_user', 'Création utilisateur'),
        ('update_user', 'Modification utilisateur'),
        ('delete_user', 'Suppression utilisateur'),
        ('toggle_user', 'Activation/désactivation utilisateur'),
        ('confirm_order', 'Validation commande'),
        ('cancel_order', 'Annulation commande'),
        ('create_invoice', 'Création facture'),
        ('create_delivery', 'Création livraison'),
        ('update_delivery', 'Mise à jour livraison'),
        ('create_bon', 'Création bon de commande'),
        ('add_stock', 'Ajout stock'),
        ('adjust_stock', 'Ajustement stock'),
        ('create_purchase', 'Commande achat'),
        ('sav_update', 'Mise à jour SAV'),
        ('add_product', 'Ajout article'),
        ('update_product', 'Modification article'),
        ('delete_product', 'Suppression article'),
        ('update_price', 'Modification prix'),
        ('dot_sale', 'Vente DOT'),
        ('other', 'Autre'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='activity_logs'
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    description = models.TextField()
    target_user_email = models.EmailField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Journal d'activité"
        verbose_name_plural = "Journal des activités"

    def __str__(self):
        return f'{self.action} — {self.user} — {self.created_at}'
