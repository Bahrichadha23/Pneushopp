from django.contrib import admin
from .models import Product, Category, StockMovement, SiteSettings, ImportJob


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'created_at']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'brand', 'reference', 'price', 'stock', 'fabrication_date', 'is_active']
    list_filter = ['is_active', 'season', 'brand', 'category']
    search_fields = ['name', 'brand', 'reference', 'designation']


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ['product', 'type', 'quantity', 'created_at']


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    pass


@admin.register(ImportJob)
class ImportJobAdmin(admin.ModelAdmin):
    list_display = ['original_filename', 'status', 'created_count', 'error_count', 'created_at']
    readonly_fields = ['id', 'created_at', 'updated_at']
