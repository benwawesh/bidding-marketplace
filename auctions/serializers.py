from rest_framework import serializers
from django.utils import timezone
from .models import Category, Auction, Round, Participation, Bid, Payment, Cart, CartItem, Order, OrderItem
from accounts.models import User


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for product categories"""
    auction_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'image',
            'is_active', 'created_at', 'auction_count'
        ]
        read_only_fields = ['id', 'created_at', 'slug']

    def get_auction_count(self, obj):
        """Count active auctions in this category"""
        return obj.auctions.filter(status='active').count()


class UserMinimalSerializer(serializers.ModelSerializer):
    """Minimal user info for nested serialization"""

    class Meta:
        model = User
        fields = ['id', 'username', 'user_type']
        read_only_fields = ['id', 'username', 'user_type']


class RoundSerializer(serializers.ModelSerializer):
    """Serializer for auction rounds"""
    is_open = serializers.ReadOnlyField()
    participant_count = serializers.SerializerMethodField()
    bid_count = serializers.SerializerMethodField()

    class Meta:
        model = Round
        fields = [
            'id', 'auction', 'round_number', 'base_price',
            'participation_fee', 'start_time', 'end_time',
            'is_active', 'is_open', 'participant_count',
            'bid_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_participant_count(self, obj):
        """Count participants in this round"""
        return obj.participations.filter(payment_status='completed').count()

    def get_bid_count(self, obj):
        """Count bids in this round"""
        return obj.bids.filter(is_valid=True).count()


class BidSerializer(serializers.ModelSerializer):
    """Serializer for bids (pledge amounts)"""
    user_info = UserMinimalSerializer(source='user', read_only=True)
    round_number = serializers.IntegerField(source='round.round_number', read_only=True)

    class Meta:
        model = Bid
        fields = [
            'id', 'user', 'user_info', 'auction', 'round',
            'round_number', 'pledge_amount', 'is_valid', 'submitted_at'
        ]
        read_only_fields = ['id', 'user', 'submitted_at', 'is_valid']

    def validate(self, data):
        """Validate bid meets minimum requirements"""
        round_obj = data.get('round')
        pledge_amount = data.get('pledge_amount')

        # Check if round is open
        if not round_obj.is_open:
            raise serializers.ValidationError("This round is not accepting bids.")

        # Check if pledge meets base price
        if pledge_amount < round_obj.base_price:
            raise serializers.ValidationError(
                f"Pledge amount must be at least KES {round_obj.base_price}"
            )

        # Check if user has paid participation fee for this round
        user = self.context['request'].user
        has_participated = Participation.objects.filter(
            user=user,
            round=round_obj,
            payment_status='completed'
        ).exists()

        if not has_participated:
            raise serializers.ValidationError(
                "You must pay the participation fee before bidding."
            )

        return data


class ParticipationSerializer(serializers.ModelSerializer):
    """Serializer for participation tracking"""
    user_info = UserMinimalSerializer(source='user', read_only=True)
    round_number = serializers.IntegerField(source='round.round_number', read_only=True)

    class Meta:
        model = Participation
        fields = [
            'id', 'user', 'user_info', 'auction', 'round',
            'round_number', 'fee_paid', 'payment_status',
            'paid_at', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'paid_at', 'created_at']


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for payment transactions"""
    user_info = UserMinimalSerializer(source='user', read_only=True)
    auction_title = serializers.CharField(source='auction.title', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'user', 'user_info', 'auction', 'auction_title',
            'payment_type', 'amount', 'method', 'status',
            'transaction_id', 'proof', 'created_at', 'completed_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'completed_at']


class AuctionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for auction listings"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    seller_username = serializers.CharField(source='created_by.username', read_only=True)
    is_active = serializers.ReadOnlyField()
    time_remaining = serializers.ReadOnlyField()
    participant_count = serializers.SerializerMethodField()
    highest_bid = serializers.SerializerMethodField()

    class Meta:
        model = Auction
        fields = [
            'id', 'title', 'category', 'category_name',
            'base_price', 'participation_fee', 'product_type',
            'buy_now_price', 'market_price', 'stock_quantity', 'units_sold',
            'main_image', 'start_time', 'end_time', 'status',
            'is_active', 'time_remaining', 'seller_username',
            'participant_count', 'highest_bid', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_participant_count(self, obj):
        return obj.get_participant_count()

    def get_highest_bid(self, obj):
        highest = obj.get_highest_bid()
        return highest.pledge_amount if highest else None


class AuctionDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for single auction view"""
    category_info = CategorySerializer(source='category', read_only=True)
    seller_info = UserMinimalSerializer(source='created_by', read_only=True)
    winner_info = UserMinimalSerializer(source='winner', read_only=True)

    # Related data
    rounds = RoundSerializer(many=True, read_only=True)
    current_round = serializers.SerializerMethodField()

    # Computed fields
    is_active = serializers.ReadOnlyField()
    time_remaining = serializers.ReadOnlyField()
    participant_count = serializers.SerializerMethodField()
    total_revenue = serializers.SerializerMethodField()
    highest_bid = serializers.SerializerMethodField()

    # User-specific fields (requires authenticated user)
    user_has_participated = serializers.SerializerMethodField()
    user_highest_bid = serializers.SerializerMethodField()

    class Meta:
        model = Auction
        fields = [
            'id', 'title', 'description', 'category', 'category_info',
            'base_price', 'participation_fee', 'product_type',
            'buy_now_price', 'stock_quantity', 'units_sold',
            'main_image', 'start_time', 'end_time', 'status',
            'is_active', 'time_remaining', 'created_by', 'seller_info',
            'winner', 'winner_info', 'winning_amount', 'rounds',
            'current_round', 'participant_count', 'total_revenue',
            'highest_bid', 'user_has_participated', 'user_highest_bid',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'winner', 'winning_amount', 'created_at', 'updated_at']

    def get_current_round(self, obj):
        current = obj.get_current_round()
        if current:
            return RoundSerializer(current).data
        return None

    def get_participant_count(self, obj):
        return obj.get_participant_count()

    def get_total_revenue(self, obj):
        return str(obj.get_total_revenue())

    def get_highest_bid(self, obj):
        highest = obj.get_highest_bid()
        if highest:
            return {
                'amount': str(highest.pledge_amount),
                'user': highest.user.username,
                'submitted_at': highest.submitted_at
            }
        return None

    def get_user_has_participated(self, obj):
        """Check if current user has participated in current round"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False

        current_round = obj.get_current_round()
        if not current_round:
            return False

        return Participation.objects.filter(
            user=request.user,
            round=current_round,
            payment_status='completed'
        ).exists()

    def get_user_highest_bid(self, obj):
        """Get current user's highest bid in current round"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None

        current_round = obj.get_current_round()
        if not current_round:
            return None

        user_bid = Bid.objects.filter(
            user=request.user,
            round=current_round,
            is_valid=True
        ).order_by('-pledge_amount').first()

        return str(user_bid.pledge_amount) if user_bid else None


class AuctionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new auctions/products (seller only)"""

    class Meta:
        model = Auction
        fields = [
            'id', 'title', 'description', 'category', 'base_price',
            'participation_fee', 'product_type', 'buy_now_price', 'market_price',
            'stock_quantity', 'main_image', 'start_time', 'end_time',
            # NEW FIELDS - Flash Sales & Homepage Curation
            'is_flash_sale', 'discount_percentage', 'flash_sale_ends_at',
            'is_featured', 'display_order'
        ]
        read_only_fields = ['id']
        extra_kwargs = {
            'start_time': {'required': False},
            'end_time': {'required': False},
        }

    def validate(self, data):
        """Validate auction/product creation data"""
        product_type = data.get('product_type', 'auction')
        buy_now_price = data.get('buy_now_price')

        # Validate buy_now_price for buy_now and both types
        if product_type in ['buy_now', 'both']:
            if not buy_now_price or buy_now_price <= 0:
                raise serializers.ValidationError(
                    "Buy now price is required for fixed-price and hybrid products."
                )

        # NO TIMING VALIDATION - Admin controls auctions manually
        
        return data

    def create(self, validated_data):
        """Create auction/product - Round 1 will be created when admin activates"""
        product_type = validated_data.get('product_type', 'auction')

        # Set the seller as the creator
        validated_data['created_by'] = self.context['request'].user
        validated_data['status'] = 'draft'  # Start as draft

        # For auctions, set default timing to allow manual control
        if product_type in ['auction', 'both']:
            if 'start_time' not in validated_data or not validated_data['start_time']:
                validated_data['start_time'] = timezone.now()
            if 'end_time' not in validated_data or not validated_data['end_time']:
                # Set far future date (1 year) - admin will close manually
                validated_data['end_time'] = timezone.now() + timezone.timedelta(days=365)

        auction = Auction.objects.create(**validated_data)

        # NOTE: Round 1 is NOT created here - it's created when admin clicks "Activate"
        # This prevents duplicate Round 1 creation errors

        return auction

class CartItemProductSerializer(serializers.ModelSerializer):
    """Minimal product info for cart items"""

    class Meta:
        model = Auction
        fields = ['id', 'title', 'buy_now_price', 'stock_quantity', 'main_image']


class CartItemSerializer(serializers.ModelSerializer):
    """Serializer for cart items"""
    product = CartItemProductSerializer(read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity', 'price', 'total_price', 'added_at', 'updated_at']
        read_only_fields = ['id', 'added_at', 'updated_at']


class CartSerializer(serializers.ModelSerializer):
    """Serializer for shopping cart"""
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_items', 'subtotal', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class AddToCartSerializer(serializers.Serializer):
    """Serializer for adding items to cart"""
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1, default=1)

    def validate_product_id(self, value):
        """Validate product exists and can be added to cart"""
        try:
            product = Auction.objects.get(id=value)
        except Auction.DoesNotExist:
            raise serializers.ValidationError("Product not found")

        if product.product_type not in ['buy_now', 'both']:
            raise serializers.ValidationError("Only buy_now or both products can be added to cart")

        return value

    def validate(self, data):
        """Validate quantity against stock"""
        product = Auction.objects.get(id=data['product_id'])

        if product.stock_quantity and data['quantity'] > product.stock_quantity:
            raise serializers.ValidationError({
                'quantity': f"Only {product.stock_quantity} units available"
            })

        return data


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for order items"""
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_title', 'product_price',
            'quantity', 'total_price', 'created_at'
        ]
        read_only_fields = ['id', 'product_title', 'product_price', 'created_at']


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for orders"""
    items = OrderItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'items', 'total_items',
            'subtotal', 'shipping_fee', 'total_amount',
            'shipping_name', 'shipping_phone', 'shipping_address', 'shipping_city',
            'payment_method', 'payment_status', 'customer_notes',
            'created_at', 'updated_at', 'paid_at'
        ]
        read_only_fields = [
            'id', 'order_number', 'subtotal', 'total_amount',
            'payment_status', 'created_at', 'updated_at', 'paid_at'
        ]


class CreateOrderSerializer(serializers.Serializer):
    """Serializer for creating orders from cart"""
    shipping_name = serializers.CharField(max_length=200)
    shipping_phone = serializers.CharField(max_length=20)
    shipping_address = serializers.CharField()
    shipping_city = serializers.CharField(max_length=100)
    customer_notes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        """Validate that user has items in cart"""
        user = self.context['request'].user

        # Check if user has a cart
        from .models import Cart
        try:
            cart = Cart.objects.get(user=user)
            if cart.items.count() == 0:
                raise serializers.ValidationError("Your cart is empty")
        except Cart.DoesNotExist:
            raise serializers.ValidationError("Your cart is empty")

        # Validate stock for all items
        for item in cart.items.all():
            if item.product.product_type == 'buy_now' or item.product.product_type == 'both':
                if item.product.stock_quantity < item.quantity:
                    raise serializers.ValidationError(
                        f"Insufficient stock for {item.product.title}. "
                        f"Only {item.product.stock_quantity} available."
                    )
            else:
                raise serializers.ValidationError(
                    f"{item.product.title} is not available for direct purchase"
                )

        return data

    def create(self, validated_data):
        """Create order from cart"""
        user = self.context['request'].user

        from .models import Cart
        cart = Cart.objects.get(user=user)

        # Create order
        order = Order.objects.create(
            user=user,
            subtotal=cart.subtotal,
            shipping_fee=0,  # Free shipping for now
            total_amount=cart.subtotal,
            shipping_name=validated_data['shipping_name'],
            shipping_phone=validated_data['shipping_phone'],
            shipping_address=validated_data['shipping_address'],
            shipping_city=validated_data['shipping_city'],
            customer_notes=validated_data.get('customer_notes', ''),
            status='pending',
            payment_status='pending'
        )

        # Create order items from cart items
        for cart_item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                product_title=cart_item.product.title,
                product_price=cart_item.price,
                quantity=cart_item.quantity
            )

        # Clear cart after creating order
        cart.clear()

        return order


class ParticipantDetailSerializer(serializers.ModelSerializer):
    """Detailed participant info for admin"""
    user = serializers.SerializerMethodField()

    class Meta:
        model = Participation
        fields = [
            'id', 'user', 'fee_paid', 'payment_status',
            'paid_at', 'created_at'
        ]

    def get_user(self, obj):
        """Return full user details"""
        user = obj.user
        return {
            'id': str(user.id),
            'username': user.username,
            'email': user.email,
            'phone': user.phone if hasattr(user, 'phone') else None,
            'first_name': user.first_name,
            'last_name': user.last_name,
        }


class BidDetailSerializer(serializers.ModelSerializer):
    """Detailed bid info with ranking for admin"""
    user = serializers.SerializerMethodField()
    position = serializers.IntegerField(read_only=True)

    class Meta:
        model = Bid
        fields = [
            'id', 'user', 'pledge_amount', 'position',
            'is_valid', 'submitted_at'
        ]

    def get_user(self, obj):
        """Return full user details"""
        user = obj.user
        return {
            'id': str(user.id),
            'username': user.username,
            'email': user.email,
            'phone': user.phone if hasattr(user, 'phone') else None,
            'first_name': user.first_name,
            'last_name': user.last_name,
        }


class OrderAdminSerializer(serializers.ModelSerializer):
    """Complete order details for admin"""
    items = OrderItemSerializer(many=True, read_only=True)
    customer = serializers.SerializerMethodField()
    total_items = serializers.IntegerField(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer', 'status', 'items', 'total_items',
            'subtotal', 'shipping_fee', 'total_amount',
            'shipping_name', 'shipping_phone', 'shipping_address', 'shipping_city',
            'payment_method', 'payment_status', 'mpesa_transaction_id',
            'customer_notes', 'admin_notes',
            'created_at', 'updated_at', 'paid_at'
        ]

    def get_customer(self, obj):
        """Return customer details"""
        user = obj.user
        return {
            'id': str(user.id),
            'username': user.username,
            'email': user.email,
            'phone': user.phone if hasattr(user, 'phone') else None,
        }


class CustomerSerializer(serializers.ModelSerializer):
    """Customer info with stats for admin"""
    total_orders = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()
    total_bids = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone', 'first_name', 'last_name',
            'user_type', 'total_orders', 'total_spent', 'total_bids',
            'date_joined'
        ]

    def get_total_orders(self, obj):
        """Count completed orders"""
        return obj.orders.filter(status__in=['paid', 'processing', 'shipped', 'delivered']).count()

    def get_total_spent(self, obj):
        """Sum of all order totals"""
        from django.db.models import Sum
        total = obj.orders.filter(
            status__in=['paid', 'processing', 'shipped', 'delivered']
        ).aggregate(total=Sum('total_amount'))['total']
        return str(total or 0)

    def get_total_bids(self, obj):
        """Count total bids placed"""
        return obj.bids.count()