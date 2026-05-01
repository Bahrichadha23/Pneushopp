from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'deliveries', views.DeliveryViewSet, basename='delivery')
router.register(r'purchase-orders', views.PurchaseOrderViewSet, basename='orders-purchase-order')

urlpatterns = [
    path('', views.OrderListCreateView.as_view(), name='orders-list'),
    path('cri-balance/', views.get_cri_balance, name='cri-balance'),
    path('<int:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('<int:pk>/upload-payment-image/', views.upload_payment_image, name='upload-payment-image'),
    path('', include(router.urls)),
]
