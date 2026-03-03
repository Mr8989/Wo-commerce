from rest_framework import serializers
from .models import Category, Product, Order, OrderItem, AnonymousUser, CartItem


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'product_count', 'created_at']

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    image_display = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'category', 
            'category_name', 'image', 'image_url', 'image_display', 
            'stock', 'available_sizes', 'is_featured', 'is_active',
            'created_at', 'updated_at'
        ]

    def get_image_display(self, obj):
        # Prioritize uploaded image over URL
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
        return obj.image_url


class AnonymousUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnonymousUser
        fields = ['id', 'fingerprint', 'email', 'first_name', 'last_name', 'phone', 'created_at']


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity', 'size', 'created_at', 'updated_at']


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_image', 'quantity', 'size', 'price', 'total_price']

    def get_product_image(self, obj):
        if obj.product.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.product.image.url)
        return obj.product.image_url


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    order_items = serializers.ListField(write_only=True, required=False)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'email', 'first_name', 'last_name', 'phone',
            'delivery_address', 'delivery_city', 'delivery_state',  # Changed
            'delivery_postal_code', 'delivery_country',  # Changed
            'total_amount', 'status', 'notes', 'payment_method',
            'items', 'order_items',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['order_number']

    def create(self, validated_data):
        order_items_data = validated_data.pop('order_items', [])
        order = Order.objects.create(**validated_data)
        
        for item_data in order_items_data:
            OrderItem.objects.create(order=order, **item_data)
        
        return order
