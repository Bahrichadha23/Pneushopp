from django.urls import path
from . import views
from . import import_views

urlpatterns = [
    path('', views.ProductListView.as_view(), name='product_list'),
    path('featured/', views.FeaturedProductsView.as_view(), name='featured_products'),
    path('promotions/', views.PromotionProductsView.as_view(), name='promotion_products'),
    path('set-promotion/', views.set_promotion, name='set_promotion'),
    path('categories/', views.CategoryListView.as_view(), name='categories'),
    path('search-suggestions/', views.product_search_suggestions, name='search_suggestions'),
    path('filters/', views.product_filters, name='product_filters'),
    path('site-settings/', views.site_settings, name='site_settings'),
    path('import/excel/', import_views.import_excel, name='import_excel'),
    path('import/status/<str:job_id>/', import_views.import_status, name='import_status'),
    path('import/upload/', import_views.upload_import_file, name='import_upload'),
    path('import/files/', import_views.list_import_files, name='import_files_list'),
    path('import/files/<str:job_id>/run/', import_views.run_import_file, name='import_file_run'),
    path('import/files/<str:job_id>/', import_views.delete_import_file, name='import_file_delete'),
    path('<int:id>/', views.ProductUpdateView.as_view(), name='product_update'),
    path('<slug:slug>/', views.ProductDetailView.as_view(), name='product_detail'),
]
