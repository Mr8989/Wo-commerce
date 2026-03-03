from urllib import request

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count
from django.http import Http404
from .models import Category, Product, Order, AnonymousUser, CartItem
from .serializers import (
    CategorySerializer, ProductSerializer, OrderSerializer,
    AnonymousUserSerializer, CartItemSerializer
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer 
    permission_classes = [permissions.AllowAny] 
     #lookup_field = 'slug'   Keep for detail pages
    
    def get_object(self):
        """
        Allow lookup by both ID and slug
        """
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        
        # Try to get by slug first
        if lookup_url_kwarg in self.kwargs:
            filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
            try:
                obj = self.get_queryset().get(**filter_kwargs)
                self.check_object_permissions(self.request, obj)
                return obj
            except Product.DoesNotExist:
                pass
        
        # Fall back to ID if slug doesn't work
        try:
            obj = self.get_queryset().get(pk=self.kwargs.get(lookup_url_kwarg))
            self.check_object_permissions(self.request, obj)
            return obj
        except Product.DoesNotExist:
            raise Http404

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category__slug=category)
        
        # Filter by search query
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search)
            )
        
        # Filter featured products
        featured = self.request.query_params.get('featured', None)
        if featured:
            queryset = queryset.filter(is_featured=True)
        
        # Sort options
        sort_by = self.request.query_params.get('sort', None)
        if sort_by == 'price_low':
            queryset = queryset.order_by('price')
        elif sort_by == 'price_high':
            queryset = queryset.order_by('-price')
        elif sort_by == 'newest':
            queryset = queryset.order_by('-created_at')
        
        return queryset

@action(detail=False, methods=['get'])
def featured(self, request):
        featured_products = self.queryset.filter(is_featured=True)[:8]
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
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        # Get or create anonymous user
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
        
        # Create order
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
        
        # Add order items
        items = request.data.get('items', [])
        for item in items:
            order.items.create(
                product_id=item['product_id'],
                quantity=item['quantity'],
                size=item.get('size', ''),
                price=item['price']
            )
        
        # Clear cart
        if fingerprint and anonymous_user:
            CartItem.objects.filter(anonymous_user=anonymous_user).delete()
        
        return Response(
            OrderSerializer(order, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
    
    def destroy(self, request, *args, **kwargs):
        """
        Delete an order and all its items
        """
        try:
            order = self.get_object()
            order_number = order.order_number
            
            # Delete order (items will cascade delete automatically)
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
        except Exception as e:
            return Response(
                {"error": f"Failed to delete order: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def partial_update(self, request, *args, **kwargs):
        """
        Update order status
        """
        return super().partial_update(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get order statistics for dashboard
        """
        stats = {
            'total_orders': Order.objects.count(),
            'pending_orders': Order.objects.filter(status='pending').count(),
            'processing_orders': Order.objects.filter(status='processing').count(),
            'total_revenue': Order.objects.aggregate(
                total=sum('total_amount')
            )['total'] or 0,
        }
        return Response(stats)
