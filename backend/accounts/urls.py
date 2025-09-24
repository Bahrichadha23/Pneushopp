from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.login_view, name='login'),
    path('verify-email/', views.verify_email, name='verify_email'),
    path('forgot-password/', views.forgot_password, name='forgot_password'),
    path('verify-reset-token/', views.verify_reset_token, name='verify_reset_token'),
    path('reset-password/', views.reset_password, name='reset_password'),
    path('user/', views.user_profile, name='user_profile'),
    path('clients/', views.clients_list, name='clients_list'),  # new endpoint
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
