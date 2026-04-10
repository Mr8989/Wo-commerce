from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import admin_login, admin_change_password, admin_verify

router = DefaultRouter()
router.register(r'products', views.ProductViewSet)
router.register(r'categories', views.CategoryViewSet)
router.register(r'orders', views.OrderViewSet)
router.register(r'cart', views.CartViewSet, basename='cart')

urlpatterns = [
    path('', include(router.urls)),
    
    # Admin authentication endpoints
    path('admin/login/', admin_login, name='admin-login'),
    path('admin/change-password/', admin_change_password, name='admin-change-password'),
    path('admin/verify/', admin_verify, name='admin-verify'),
]