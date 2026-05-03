"""pneushop URL Configuration"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/', include('accounts.urls')),
    path('api/products/', include('products.urls')),
    path('api/admin/', include('products.admin_urls')),
    path('api/cart/', include('cart.urls')),
    path('api/favorites/', include('favorites.urls')),
    path('', include('suppliers.urls')),
    path('', include('purchases.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/communication/', include('communication.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
