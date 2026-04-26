from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import (
    admin_login, 
    admin_verify, 
    admin_request_password_change,
    admin_verify_and_change_password
)

router = DefaultRouter()
router.register(r'products', views.ProductViewSet)
router.register(r'categories', views.CategoryViewSet)
router.register(r'orders', views.OrderViewSet)
router.register(r'cart', views.CartViewSet, basename='cart')

urlpatterns = [
    path('', include(router.urls)),
    
    # Admin authentication endpoints
    path('admin/login/', admin_login, name='admin-login'),
    path('admin/verify/', admin_verify, name='admin-verify'),
    
    # Password change with email verification
    path('admin/request-password-change/', admin_request_password_change, name='admin-request-password-change'),
    path('admin/verify-change-password/', admin_verify_and_change_password, name='admin-verify-change-password'),
]