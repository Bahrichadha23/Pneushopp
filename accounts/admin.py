from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['email', 'username', 'first_name', 'last_name', 'role', 'is_verified', 'is_active']
    list_filter = ['role', 'is_verified', 'is_active']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    fieldsets = UserAdmin.fieldsets + (
        ('PneuShop', {'fields': ('phone', 'address', 'role', 'is_verified', 'verification_code')}),
    )
