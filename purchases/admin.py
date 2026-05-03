from django.contrib import admin
from .models import PurchaseOrder, PurchaseOrderItem


class PurchaseOrderItemInline(admin.TabularInline):
    model = PurchaseOrderItem
    extra = 0


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'supplier', 'status', 'total', 'order_date']
    list_filter = ['status', 'supplier']
    search_fields = ['order_number', 'invoice_number']
    inlines = [PurchaseOrderItemInline]
