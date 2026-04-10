from urllib import request
from .notification import send_order_notifications, send_status_update_sms
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count, Sum
from django.http import Http404
from .models import Category, Product, Order, AnonymousUser, CartItem
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.conf import settings
from .admin_utils import update_env_file
from django.utils import timezone
from .serializers import (
    CategorySerializer, ProductSerializer, OrderSerializer,
    AnonymousUserSerializer, CartItemSerializer
)
from .models import AdminUser
from .serializers_admin import(
    AdminLoginSerializer, 
    AdminChangePasswordSerializer,
    AdminUserSerializer
)


@api_view(['POST'])
@permission_classes([AllowAny])
def change_admin_password(request):
    """Change admin password"""
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    username = request.data.get('username')
    
    # Verify current credentials
    stored_username = settings.ADMIN_USERNAME
    stored_password = settings.ADMIN_PASSWORD
    
    if username != stored_username or current_password != stored_password:
        return Response(
            {'error': 'Invalid credentials'},
            status=400
        )
    
    # Validate new password
    if len(new_password) < 8:
        return Response(
            {'error': 'Password must be at least 8 characters'},
            status=400
        )
    
    # Update .env file (frontend)
    # Note: This updates backend .env, you'll need to manually update frontend/.env
    
    return Response({
        'message': 'Password validation successful',
        'new_password': new_password,
        'instructions': [
            'Update frontend/.env file with:',
            f'VITE_ADMIN_PASSWORD={new_password}',
            'Restart frontend server (npm run dev)',
            'Your new password will be active after restart'
        ]
    })


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


from django.shortcuts import get_object_or_404

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_object(self):
        """
        Allow lookup by both ID and slug
        """
        lookup_value = self.kwargs.get('pk')
        
        # Try to get by ID first (for admin operations)
        if lookup_value.isdigit():
            return get_object_or_404(Product, id=int(lookup_value))
        
        # Fall back to slug (for frontend product pages)
        return get_object_or_404(Product, slug=lookup_value)
    
    def get_queryset(self):
        queryset = Product.objects.all()
          
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category__slug=category)
        
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search)
            )
        
        featured = self.request.query_params.get('featured', None)
        if featured:
            queryset = queryset.filter(is_featured=True)
        
        sort_by = self.request.query_params.get('sort', None)
        if sort_by == 'price_low':
            queryset = queryset.order_by('price')
        elif sort_by == 'price_high':
            queryset = queryset.order_by('-price')
        elif sort_by == 'newest':
            queryset = queryset.order_by('-created_at')
        
        return queryset

    @action(detail=False, methods=['get'], url_path='featured')
    def featured(self, request):
        """Get featured products"""
        featured_products = Product.objects.filter(
            is_featured=True, 
            is_active=True
        ).order_by('-created_at')[:8]
        
        serializer = self.get_serializer(featured_products, many=True)
        return Response(serializer.data)


class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartItemSerializer

    def get_queryset(self):
        fingerprint = self.request.query_params.get('fingerprint')
        if fingerprint:
            try:
                user = AnonymousUser.objects.get(fingerprint=fingerprint)
                return CartItem.objects.filter(anonymous_user=user)
            except AnonymousUser.DoesNotExist:
                return CartItem.objects.none()
            return CartItem.objects.none()

    def create(self, request, *args, **kwargs):
        fingerprint = request.data.get('fingerprint')
        if not fingerprint:
            return Response(
                {'error': 'Fingerprint is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user, _ = AnonymousUser.objects.get_or_create(fingerprint=fingerprint)
        
        product_id = request.data.get('product_id')
        size = request.data.get('size', '')
        quantity = request.data.get('quantity', 1)
        
        cart_item, created = CartItem.objects.get_or_create(
            anonymous_user=user,
            product_id=product_id,
            size=size,
            defaults={'quantity': quantity}
        )
        
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
        
        serializer = self.get_serializer(cart_item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def clear(self, request):
        fingerprint = request.data.get('fingerprint')
        if fingerprint:
            try:
                user = AnonymousUser.objects.get(fingerprint=fingerprint)
                CartItem.objects.filter(anonymous_user=user).delete()
                return Response({'message': 'Cart cleared'})
            except AnonymousUser.DoesNotExist:
                pass
        return Response({'message': 'No cart found'})


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Order.objects.all().order_by('-created_at')
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Search by order number
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(order_number__icontains=search)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        fingerprint = request.data.get('fingerprint')
        anonymous_user = None
        if fingerprint:
            anonymous_user, _ = AnonymousUser.objects.get_or_create(
                fingerprint=fingerprint,
                defaults={
                    'email': request.data.get('email', ''),
                    'first_name': request.data.get('first_name', ''),
                    'last_name': request.data.get('last_name', ''),
                    'phone': request.data.get('phone', ''),
                }
            )
        
        order_data = {
            'anonymous_user': anonymous_user,
            'email': request.data.get('email'),
            'first_name': request.data.get('first_name'),
            'last_name': request.data.get('last_name'),
            'phone': request.data.get('phone'),
            'delivery_address': request.data.get('delivery_address'),
            'delivery_city': request.data.get('delivery_city'),
            'delivery_state': request.data.get('delivery_state'),
            'delivery_postal_code': request.data.get('delivery_postal_code'),
            'delivery_country': request.data.get('delivery_country'),
            'total_amount': request.data.get('total_amount'),
            'payment_method': request.data.get('payment_method', 'bank_transfer'),
            'notes': request.data.get('notes', ''),
        }
        
        serializer = self.get_serializer(data=order_data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        
        items = request.data.get('items', [])
        for item in items:
            order.items.create(
                product_id=item['product_id'],
                quantity=item['quantity'],
                size=item.get('size', ''),
                price=item['price']
            )
        
        if fingerprint and anonymous_user:
            CartItem.objects.filter(anonymous_user=anonymous_user).delete()
        
        # Send notifications (SMS to customer, Email to admin)
        try:
            send_order_notifications(order)
        except Exception as e:
            print(f"Notification error: {e}")
        
        return Response(
            OrderSerializer(order, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
    
    def partial_update(self, request, *args, **kwargs):
        """Update order status and send notification"""
        order = self.get_object()
        old_status = order.status
        
        response = super().partial_update(request, *args, **kwargs)
        
        new_status = request.data.get('status')
        
        # Send SMS notification if status changed
        if new_status and new_status != old_status:
            try:
                send_status_update_sms(order, new_status)
            except Exception as e:
                print(f"Status SMS error: {e}")
        
        return response
    
    def destroy(self, request, *args, **kwargs):
        """Delete order"""
        try:
            order = self.get_object()
            order_number = order.order_number
            order.delete()
            return Response(
                {"message": f"Order {order_number} deleted successfully"},
                status=status.HTTP_204_NO_CONTENT
            )
        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Allow customer to cancel their order
        URL: /api/orders/{id}/cancel/
        """
        order = self.get_object()
        
        # Only allow cancellation if order is pending or processing
        if order.status in ['pending', 'processing']:
            order.status = 'cancelled'
            order.save()
            
            # Notify customer
            try:
                send_status_update_sms(order, 'cancelled')
            except Exception as e:
                print(f"Cancellation SMS error: {e}")
            
            return Response({
                'message': 'Order cancelled successfully',
                'order': OrderSerializer(order, context={'request': request}).data
            })
        else:
            return Response(
                {'error': f'Cannot cancel order with status: {order.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get order statistics for dashboard"""
        stats = {
            'total_orders': Order.objects.count(),
            'pending_orders': Order.objects.filter(status='pending').count(),
            'processing_orders': Order.objects.filter(status='processing').count(),
            'total_revenue': Order.objects.aggregate(
                total=Sum('total_amount')
            )['total'] or 0,
        }
        return Response(stats)
    

@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login(request):
    """Admin login endpoint"""
    print("=" * 50)
    print("LOGIN ATTEMPT")
    print(f"Request data: {request.data}")
    
    serializer = AdminLoginSerializer(data=request.data)
    
    if not serializer.is_valid():
        print(f" Serializer invalid: {serializer.errors}")
        return Response(
            {'error': 'Invalid input'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    username = serializer.validated_data['username']
    password = serializer.validated_data['password']
    
    print(f"Username: {username}")
    print(f"Password length: {len(password)}")
    
    try:
        admin = AdminUser.objects.get(username=username, is_active=True)
        print(f" Found admin: {admin.username}")
        
        password_valid = admin.check_password(password)
        print(f"Password valid: {password_valid}")
        
        if password_valid:
            # Update last login
            admin.last_login = timezone.now()
            admin.save()
            
            print("Login successful")
            return Response({
                'success': True,
                'message': 'Login successful',
                'user': AdminUserSerializer(admin).data,
                'token': str(admin.id)
            })
        else:
            print("Password incorrect")
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
    
    except AdminUser.DoesNotExist:
        print(f" Admin user '{username}' not found")
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_change_password(request):
    """Change admin password"""
    serializer = AdminChangePasswordSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            {'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    username = request.data.get('username')
    current_password = serializer.validated_data['current_password']
    new_password = serializer.validated_data['new_password']
    
    try:
        admin = AdminUser.objects.get(username=username, is_active=True)
        
        if not admin.check_password(current_password):
            return Response(
                {'error': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if current_password == new_password:
            return Response(
                {'error': 'New password must be different from current password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        admin.set_password(new_password)
        admin.save()
        
        return Response({
            'success': True,
            'message': 'Password changed successfully'
        })
    
    except AdminUser.DoesNotExist:
        return Response(
            {'error': 'Admin user not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def admin_verify(request):
    """Verify admin token"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
    if not token:
        return Response(
            {'error': 'No token provided'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        admin = AdminUser.objects.get(id=token, is_active=True)
        return Response({
            'success': True,
            'user': AdminUserSerializer(admin).data
        })
    except (AdminUser.DoesNotExist, ValueError):
        return Response(
            {'error': 'Invalid token'},
            status=status.HTTP_401_UNAUTHORIZED
        )