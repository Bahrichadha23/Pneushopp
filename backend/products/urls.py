from django.urls import path
from . import views

urlpatterns = [
    path('', views.ProductListView.as_view(), name='product_list'),
    path('featured/', views.FeaturedProductsView.as_view(), name='featured_products'),
    path('categories/', views.CategoryListView.as_view(), name='categories'),
    path('search-suggestions/', views.product_search_suggestions, name='search_suggestions'),
    path('filters/', views.product_filters, name='product_filters'),
    path('<slug:slug>/', views.ProductDetailView.as_view(), name='product_detail'),
]
