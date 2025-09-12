from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Product

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'product_count', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('created_at',)

    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = 'Nombre de produits'

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'brand', 'size', 'category', 'price', 'old_price', 
        'discount_display', 'stock', 'season', 'is_featured', 'is_active'
    )
    list_filter = (
        'category', 'brand', 'season', 'is_featured', 'is_active', 
        'created_at', 'updated_at'
    )
    search_fields = ('name', 'brand', 'description', 'size')
    prepopulated_fields = {'slug': ('name', 'brand', 'size')}
    readonly_fields = ('created_at', 'updated_at', 'discount_percentage')
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('name', 'slug', 'description', 'category', 'image')
        }),
        ('Détails produit', {
            'fields': ('brand', 'size', 'season')
        }),
        ('Prix et stock', {
            'fields': ('price', 'old_price', 'stock')
        }),
        ('Options', {
            'fields': ('is_featured', 'is_active')
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at', 'discount_percentage'),
            'classes': ('collapse',)
        })
    )

    def discount_display(self, obj):
        if obj.is_on_sale:
            return format_html(
                '<span style="color: red; font-weight: bold;">-{}%</span>',
                obj.discount_percentage
            )
        return '-'
    discount_display.short_description = 'Remise'

    def save_model(self, request, obj, form, change):
        # Auto-generate slug if not provided
        if not obj.slug:
            from django.utils.text import slugify
            obj.slug = slugify(f"{obj.brand}-{obj.name}-{obj.size}")
        super().save_model(request, obj, form, change)
