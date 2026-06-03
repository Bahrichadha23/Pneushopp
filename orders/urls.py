from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'deliveries', views.DeliveryViewSet, basename='delivery')
router.register(r'purchase-orders', views.PurchaseOrderViewSet, basename='orders-purchase-order')

urlpatterns = [
    path('sav/', views.warranty_claim_view, name='sav-list-create'),
    path('sav/mes-reclamations/', views.mes_reclamations, name='sav-mes-reclamations'),
    path('sav/export/', views.sav_export_excel, name='sav-export'),
    path('sav/<int:pk>/', views.warranty_claim_detail_view, name='sav-detail'),
    path('', views.OrderListCreateView.as_view(), name='orders-list'),
    path('cri-balance/', views.get_cri_balance, name='cri-balance'),
    path('<int:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('<int:pk>/upload-payment-image/', views.upload_payment_image, name='upload-payment-image'),
    path('<int:pk>/confirm-with-dot/', views.confirm_with_dot, name='confirm-with-dot'),
    path('avoirs/', views.AvoirListCreateView.as_view(), name='avoir-list'),
    path('avoirs/search/', views.search_order_for_avoir, name='avoir-search'),
    path('avoirs/<int:pk>/', views.AvoirDetailView.as_view(), name='avoir-detail'),
    path('', include(router.urls)),
]
