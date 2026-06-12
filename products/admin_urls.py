from django.urls import path
from . import admin_views

urlpatterns = [
    path('', admin_views.admin_dashboard_stats, name='admin_products'),
    path('stats/', admin_views.admin_dashboard_stats, name='dashboard_stats'),
    path('products/', admin_views.AdminProductListCreateView.as_view(), name='product_list_create'),
    path('products/<int:pk>/', admin_views.AdminProductDetailView.as_view(), name='product_detail'),
    path('products/bulk-update/', admin_views.bulk_update_products, name='bulk_update_products'),
    path('products/reset-all/', admin_views.reset_all_products, name='reset_all_products'),
    path('products/<int:product_id>/dot-batches/', admin_views.product_dot_batches, name='product_dot_batches'),
    path('products/<int:product_id>/consume-dot-batch/', admin_views.consume_dot_batch, name='consume_dot_batch'),
    path('products/<int:product_id>/add-dot-batch/', admin_views.add_dot_batch, name='add_dot_batch'),
    path('products/<int:product_id>/adjust-dot-batch/', admin_views.adjust_dot_batch, name='adjust_dot_batch'),
    path('customers/', admin_views.customer_search, name='customer_search'),
    path('categories/', admin_views.AdminCategoryListCreateView.as_view(), name='category_list_create'),
    path('categories/<int:pk>/', admin_views.AdminCategoryDetailView.as_view(), name='category_detail'),
    path('backup/', admin_views.create_database_backup, name='create_backup'),
    path('export-customers/', admin_views.export_customer_data, name='export_customers'),
    path('reports/', admin_views.reports_data, name='reports_data'),
    path('debug/', admin_views.debug_database_stats, name='debug_stats'),
    path('stock-movements/', admin_views.stock_movements, name='stock_movements'),
]
