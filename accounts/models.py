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
