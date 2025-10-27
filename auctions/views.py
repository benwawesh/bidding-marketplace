from django.views.generic import TemplateView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Auction, Category
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Q
from .models import Cart, Order
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class HomeView(TemplateView):
    """Homepage with featured auctions and products"""
    template_name = 'auctions/home.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        now = timezone.now()

        # Base queryset for active products
        active_products = Auction.objects.filter(
            status='active'
        ).select_related('category', 'created_by')

        # ========== HERO CAROUSEL - FEATURED PRODUCTS ==========
        # Get featured products for hero carousel (ordered by display_order)
        context['hero_slides'] = active_products.filter(
            is_featured=True
        ).order_by('display_order', '-created_at')[:5]  # Max 5 slides

        # ========== FLASH SALES ==========
        # Get flash sale products (ordered by display_order)
        context['flash_sale_products'] = active_products.filter(
            is_flash_sale=True,
            flash_sale_ends_at__gte=now  # Only active flash sales
        ).order_by('display_order', '-created_at')[:8]

        # Buy Now Products (no time restrictions, just active)
        context['buy_now_products'] = active_products.filter(
            product_type='buy_now'
        ).order_by('-created_at')[:8]

        # Auction Products (time-restricted)
        context['auction_products'] = active_products.filter(
            product_type='auction',
            start_time__lte=now,
            end_time__gte=now
        ).order_by('end_time')[:8]  # Order by ending soonest

        # Both Options Products (time-restricted for auction component)
        context['both_products'] = active_products.filter(
            product_type='both',
            start_time__lte=now,
            end_time__gte=now
        ).order_by('-created_at')[:8]

        # Featured auctions for fallback (original logic)
        context['featured_auctions'] = active_products.filter(
            start_time__lte=now,
            end_time__gte=now
        ).order_by('-created_at')[:12]

        # Get categories
        context['categories'] = Category.objects.filter(is_active=True)[:8]

        return context

class BrowseAuctionsView(TemplateView):
    """Browse all auctions with filters"""
    template_name = 'auctions/browse.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        now = timezone.now()

        # Start with all auctions
        auctions = Auction.objects.select_related('category', 'created_by')

        # Filter by product type (NEW - ADD THIS)
        product_type = self.request.GET.get('product_type')
        if product_type in ['buy_now', 'auction', 'both']:
            auctions = auctions.filter(product_type=product_type)

            # Apply time restrictions based on type
            if product_type in ['auction', 'both']:
                auctions = auctions.filter(
                    status='active',
                    start_time__lte=now,
                    end_time__gte=now
                )
            elif product_type == 'buy_now':
                auctions = auctions.filter(status='active')
        else:
            # Original behavior: Filter by status
            status_filter = self.request.GET.get('status')
            if status_filter:
                auctions = auctions.filter(status=status_filter)
            else:
                # Default: show only active auctions
                auctions = auctions.filter(
                    status='active',
                    start_time__lte=now,
                    end_time__gte=now
                )

        # Filter by category if provided
        category_id = self.request.GET.get('category')
        if category_id:
            auctions = auctions.filter(category_id=category_id)

        # Search
        search_query = self.request.GET.get('search')
        if search_query:
            auctions = auctions.filter(
                Q(title__icontains=search_query) |
                Q(description__icontains=search_query)
            )

        context['auctions'] = auctions.order_by('-created_at')
        context['categories'] = Category.objects.filter(is_active=True)

        # NEW - Add these context variables for the filter tabs
        context['current_product_type'] = product_type or ''
        context['search_query'] = search_query or ''

        # NEW - Add product counts for badges
        context['buy_now_count'] = Auction.objects.filter(
            status='active',
            product_type='buy_now'
        ).count()

        context['auction_count'] = Auction.objects.filter(
            status='active',
            product_type='auction',
            start_time__lte=now,
            end_time__gte=now
        ).count()

        context['both_count'] = Auction.objects.filter(
            status='active',
            product_type='both',
            start_time__lte=now,
            end_time__gte=now
        ).count()

        return context

class AuctionDetailView(TemplateView):
    """Single auction detail page"""
    template_name = 'auctions/detail.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        auction_id = kwargs.get('auction_id')

        auction = get_object_or_404(
            Auction.objects.select_related('category', 'created_by', 'winner'),
            id=auction_id
        )

        context['auction'] = auction
        context['current_round'] = auction.get_current_round()
        context['highest_bid'] = auction.get_highest_bid()

        # Check if user has participated
        if self.request.user.is_authenticated:
            from .models import Participation
            current_round = auction.get_current_round()
            if current_round:
                context['user_has_participated'] = Participation.objects.filter(
                    user=self.request.user,
                    round=current_round,
                    payment_status='completed'
                ).exists()

        return context


class CategoryView(TemplateView):
    """Browse auctions by category"""
    template_name = 'auctions/category.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        # Get category
        category_id = self.kwargs.get('category_id')
        category = get_object_or_404(Category, id=category_id, is_active=True)

        # Get auctions in this category
        now = timezone.now()
        auctions = Auction.objects.filter(
            category=category
        ).select_related('category', 'created_by')

        # Filter by status
        status_filter = self.request.GET.get('status')
        if status_filter:
            auctions = auctions.filter(status=status_filter)
        else:
            # Default: show only active auctions
            auctions = auctions.filter(
                status='active',
                start_time__lte=now,
                end_time__gte=now
            )

        # Search within category
        search_query = self.request.GET.get('search')
        if search_query:
            auctions = auctions.filter(
                Q(title__icontains=search_query) |
                Q(description__icontains=search_query)
            )

        context['category'] = category
        context['auctions'] = auctions.order_by('-created_at')
        context['all_categories'] = Category.objects.filter(is_active=True)

        return context

class CartView(LoginRequiredMixin, TemplateView):
    """Shopping cart page"""
    template_name = 'auctions/cart.html'
    login_url = '/login/'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Cart data will be loaded via API in the template
        return context


class CheckoutView(LoginRequiredMixin, TemplateView):
    """Checkout page"""
    template_name = 'auctions/checkout.html'
    login_url = '/accounts/login/'

    def dispatch(self, request, *args, **kwargs):
        # Redirect if cart is empty
        try:
            cart = Cart.objects.get(user=request.user)
            if cart.items.count() == 0:
                return redirect('cart')
        except Cart.DoesNotExist:
            return redirect('cart')

        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        # Get cart
        try:
            cart = Cart.objects.get(user=self.request.user)
            context['cart'] = cart
        except Cart.DoesNotExist:
            context['cart'] = None

        # Pre-fill shipping info if available
        user = self.request.user
        context['default_name'] = user.get_full_name() or user.username
        context['default_phone'] = getattr(user, 'phone_number', '')

        return context


class OrderConfirmationView(LoginRequiredMixin, TemplateView):
    """Order confirmation page"""
    template_name = 'auctions/order_confirmation.html'
    login_url = '/accounts/login/'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        # Get order
        order_id = self.kwargs.get('order_id')
        try:
            order = Order.objects.get(
                id=order_id,
                user=self.request.user
            )
            context['order'] = order
        except Order.DoesNotExist:
            context['order'] = None

        return context


class OrderHistoryView(LoginRequiredMixin, TemplateView):
    """Order history page"""
    template_name = 'auctions/order_history.html'
    login_url = '/accounts/login/'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        # Get user's orders
        context['orders'] = Order.objects.filter(
            user=self.request.user
        ).prefetch_related('items').order_by('-created_at')

        return context
