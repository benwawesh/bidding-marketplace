from django.views.generic import TemplateView
from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import redirect, get_object_or_404
from django.contrib import messages
from django.db.models import Sum, Count, Q
from django.utils import timezone
from decimal import Decimal
from auctions.models import Auction, Payment, Bid, Participation, Round, Order, OrderItem
from collections import OrderedDict


class AdminRequiredMixin(LoginRequiredMixin):
    """Mixin to require admin access (staff or superuser)"""

    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return self.handle_no_permission()

        # Allow both staff and superusers
        if not (request.user.is_staff or request.user.is_superuser):
            # Redirect non-admin users to public site
            messages.error(request, 'You do not have permission to access the admin panel.')
            return redirect('home')

        return super().dispatch(request, *args, **kwargs)


class DashboardHomeView(AdminRequiredMixin, TemplateView):
    """Main dashboard home page for admins"""
    template_name = 'admin_panel/dashboard.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        # Get ALL auctions (platform-wide)
        all_auctions = Auction.objects.all()

        # Get ALL orders (platform-wide)
        all_orders = Order.objects.all()

        # Calculate auction revenue
        auction_revenue = Payment.objects.filter(
            payment_type='participation',
            status='completed'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        # Calculate order revenue
        order_revenue = all_orders.filter(
            payment_status='completed'
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')

        # Calculate statistics
        context['stats'] = {
            # Auction stats
            'total_auctions': all_auctions.count(),
            'active_auctions': all_auctions.filter(status='active').count(),
            'draft_auctions': all_auctions.filter(status='draft').count(),
            'closed_auctions': all_auctions.filter(status='closed').count(),

            # Revenue from auctions
            'auction_revenue': auction_revenue,

            'pending_revenue': Payment.objects.filter(
                payment_type='final_pledge',
                status='pending'
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00'),

            # Order stats
            'total_orders': all_orders.count(),
            'pending_orders': all_orders.filter(status='pending').count(),
            'processing_orders': all_orders.filter(status='processing').count(),
            'shipped_orders': all_orders.filter(status='shipped').count(),
            'delivered_orders': all_orders.filter(status='delivered').count(),

            # Revenue from orders
            'order_revenue': order_revenue,

            # Combined total revenue
            'total_revenue': auction_revenue + order_revenue,

            # Participation statistics
            'total_participants': all_auctions.aggregate(
                total=Count('participations__user', distinct=True)
            )['total'] or 0,

            'total_bids': Bid.objects.filter(is_valid=True).count(),
        }

        # Get recent auctions
        context['recent_auctions'] = all_auctions.select_related('category').order_by('-created_at')[:5]

        # Get recent orders
        context['recent_orders'] = all_orders.select_related('user').order_by('-created_at')[:5]

        # Get active auctions
        context['active_auctions'] = all_auctions.filter(status='active').select_related('category')[:5]

        # Get auctions ending soon (next 24 hours)
        tomorrow = timezone.now() + timezone.timedelta(days=1)
        context['ending_soon'] = all_auctions.filter(
            status='active',
            end_time__lte=tomorrow,
            end_time__gte=timezone.now()
        ).select_related('category')[:5]

        return context


class AuctionListView(AdminRequiredMixin, TemplateView):
    """List all auctions (platform-wide)"""
    template_name = 'admin_panel/auctions_list.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        # Get filter from query params
        status_filter = self.request.GET.get('status', 'all')

        # Get ALL auctions
        auctions = Auction.objects.all().select_related('category', 'created_by')

        if status_filter != 'all':
            auctions = auctions.filter(status=status_filter)

        context['auctions'] = auctions.order_by('-created_at')
        context['status_filter'] = status_filter

        return context


class AuctionCreateView(AdminRequiredMixin, TemplateView):
    """Create new auction form"""
    template_name = 'admin_panel/auction_create.html'


class AuctionDetailView(AdminRequiredMixin, TemplateView):
    """View single auction details with analytics"""
    template_name = 'admin_panel/auction_detail.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        auction_id = kwargs.get('auction_id')

        try:
            # Get any auction (no created_by filter)
            auction = Auction.objects.select_related('category', 'winner').get(id=auction_id)
            context['auction'] = auction
        except Auction.DoesNotExist:
            context['error'] = 'Auction not found'

        return context


class AuctionEditView(AdminRequiredMixin, TemplateView):
    """Edit auction form"""
    template_name = 'admin_panel/auction_edit.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        auction_id = kwargs.get('auction_id')

        try:
            # Get any auction (no created_by filter)
            auction = Auction.objects.get(id=auction_id)
            context['auction'] = auction
        except Auction.DoesNotExist:
            context['error'] = 'Auction not found'

        return context


class RevenueReportView(AdminRequiredMixin, TemplateView):
    """Revenue analytics and reports (platform-wide)"""
    template_name = 'admin_panel/revenue_report.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        # Get ALL payments (platform-wide)
        payments = Payment.objects.filter(status='completed')

        context['revenue_data'] = {
            'total_revenue': payments.aggregate(total=Sum('amount'))['total'] or Decimal('0.00'),

            'participation_revenue': payments.filter(
                payment_type='participation'
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00'),

            'pledge_revenue': payments.filter(
                payment_type='final_pledge'
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00'),

            'payment_count': payments.count(),
        }

        # Recent payments
        context['recent_payments'] = payments.select_related('user', 'auction').order_by('-created_at')[:10]

        return context


class ParticipantsView(AdminRequiredMixin, TemplateView):
    """View all participants for a specific auction"""
    template_name = 'admin_panel/participants.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        auction_id = self.kwargs.get('auction_id')

        # Get any auction (no created_by filter)
        auction = get_object_or_404(Auction, id=auction_id)

        # Get ALL rounds for this auction
        all_rounds = Round.objects.filter(auction=auction).order_by('round_number')

        # Get all participations for this auction
        participations = Participation.objects.filter(
            auction=auction
        ).select_related('user', 'round').order_by('round__round_number', '-created_at')

        # Group participations by round
        rounds_data = OrderedDict()

        # Initialize all rounds
        for round_obj in all_rounds:
            rounds_data[round_obj.round_number] = {
                'round': round_obj,
                'participations': []
            }

        # Add participations to their respective rounds
        for participation in participations:
            round_num = participation.round.round_number

            # Get the user's bid for this round
            user_bid = Bid.objects.filter(
                user=participation.user,
                auction=auction,
                round=participation.round,
                is_valid=True
            ).order_by('-pledge_amount').first()

            participation.bid_amount = user_bid.pledge_amount if user_bid else None
            rounds_data[round_num]['participations'].append(participation)

        # Calculate statistics
        total_participants = participations.filter(
            payment_status='completed'
        ).values('user').distinct().count()

        # Get first round number for default tab
        first_round = list(rounds_data.keys())[0] if rounds_data else 1

        context['auction'] = auction
        context['rounds_data'] = rounds_data
        context['total_participants'] = total_participants
        context['total_rounds'] = all_rounds.count()
        context['first_round'] = first_round

        return context


class OrderListView(AdminRequiredMixin, TemplateView):
    """View ALL orders (platform-wide)"""
    template_name = 'admin_panel/order_list.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        # Get filter from query params
        status_filter = self.request.GET.get('status', 'all')
        search_query = self.request.GET.get('search', '')

        # Get ALL orders (platform-wide)
        orders = Order.objects.all().select_related('user').prefetch_related('items__product')

        # Apply status filter
        if status_filter != 'all':
            orders = orders.filter(status=status_filter)

        # Apply search filter
        if search_query:
            orders = orders.filter(
                Q(order_number__icontains=search_query) |
                Q(shipping_name__icontains=search_query) |
                Q(shipping_phone__icontains=search_query) |
                Q(user__username__icontains=search_query)
            )

        # Order by most recent
        orders = orders.order_by('-created_at')

        # Calculate stats
        all_orders = Order.objects.all()

        stats = {
            'total_orders': all_orders.count(),
            'pending_orders': all_orders.filter(status='pending').count(),
            'paid_orders': all_orders.filter(status='paid').count(),
            'processing_orders': all_orders.filter(status='processing').count(),
            'shipped_orders': all_orders.filter(status='shipped').count(),
            'delivered_orders': all_orders.filter(status='delivered').count(),
            'cancelled_orders': all_orders.filter(status='cancelled').count(),

            # Revenue stats
            'total_revenue': all_orders.filter(
                payment_status='completed'
            ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00'),

            'pending_revenue': all_orders.filter(
                payment_status='pending'
            ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00'),
        }

        context['orders'] = orders
        context['stats'] = stats
        context['status_filter'] = status_filter
        context['search_query'] = search_query

        return context


class OrderDetailView(AdminRequiredMixin, TemplateView):
    """View individual order details"""
    template_name = 'admin_panel/order_detail.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        order_id = kwargs.get('order_id')

        try:
            # Get any order (no filter)
            order = Order.objects.filter(
                id=order_id
            ).select_related('user').prefetch_related('items__product').first()

            if not order:
                context['error'] = 'Order not found'
                return context

            context['order'] = order
            context['order_items'] = order.items.all()

        except Exception as e:
            context['error'] = f'Error loading order: {str(e)}'

        return context


class UpdateOrderStatusView(AdminRequiredMixin, View):
    """Update order status"""

    def post(self, request, order_id):
        try:
            # Get any order (no filter)
            order = Order.objects.filter(id=order_id).first()

            if not order:
                messages.error(request, 'Order not found')
                return redirect('admin_panel:order_list')

            new_status = request.POST.get('status')

            # Validate status
            valid_statuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']
            if new_status not in valid_statuses:
                messages.error(request, 'Invalid status')
                return redirect('admin_panel:order_detail', order_id=order_id)

            # Update status
            old_status = order.status
            order.status = new_status
            order.save()

            messages.success(request, f'✅ Order status updated from "{old_status}" to "{new_status}"')
            return redirect('admin_panel:order_detail', order_id=order_id)

        except Exception as e:
            messages.error(request, f'Error updating status: {str(e)}')
            return redirect('admin_panel:order_list')


class SettingsView(AdminRequiredMixin, TemplateView):
    """Admin settings"""
    template_name = 'admin_panel/settings.html'


# Activation and Close Views
class ActivateAuctionView(AdminRequiredMixin, View):
    """Activate an auction"""

    def post(self, request, auction_id):
        auction = get_object_or_404(Auction, id=auction_id)

        if auction.status != 'draft':
            messages.error(request, 'Can only activate draft auctions.')
            return redirect('admin_panel:auction_detail', auction_id=auction_id)

        auction.status = 'active'
        auction.save()

        messages.success(request, f'✅ Auction "{auction.title}" is now ACTIVE and visible to all users!')
        return redirect('admin_panel:auction_detail', auction_id=auction_id)


class CloseAuctionView(AdminRequiredMixin, View):
    """Close an auction and determine winner"""

    def post(self, request, auction_id):
        auction = get_object_or_404(Auction, id=auction_id)

        if auction.status != 'active':
            messages.error(request, 'Can only close active auctions.')
            return redirect('admin_panel:auction_detail', auction_id=auction_id)

        # Find highest bid
        highest_bid = auction.get_highest_bid()

        if highest_bid:
            auction.winner = highest_bid.user
            auction.winning_amount = highest_bid.pledge_amount
            messages.success(request,
                             f'✅ Auction closed! Winner: {highest_bid.user.username} with KSh {highest_bid.pledge_amount}')
        else:
            messages.warning(request, '⚠️ Auction closed with no bids.')

        auction.status = 'closed'
        auction.save()

        return redirect('admin_panel:auction_detail', auction_id=auction_id)


class CreateRoundView(AdminRequiredMixin, View):
    """Create a new round for an auction"""

    def post(self, request, auction_id):
        auction = get_object_or_404(Auction, id=auction_id)

        # Get form data
        base_price = request.POST.get('base_price')
        participation_fee = request.POST.get('participation_fee')

        if not base_price or not participation_fee:
            messages.error(request, 'Base price and participation fee are required')
            return redirect('admin_panel:auction_detail', auction_id=auction.id)

        try:
            # Get last round number
            last_round = auction.rounds.order_by('-round_number').first()
            next_round_number = (last_round.round_number + 1) if last_round else 1

            # Deactivate all previous rounds
            auction.rounds.update(is_active=False)

            # Invalidate all previous bids
            Bid.objects.filter(auction=auction).update(is_valid=False)

            # Create new round
            new_round = Round.objects.create(
                auction=auction,
                round_number=next_round_number,
                base_price=Decimal(base_price),
                participation_fee=Decimal(participation_fee),
                start_time=timezone.now(),
                end_time=auction.end_time,
                is_active=True
            )

            messages.success(request,
                             f'✅ Round {next_round_number} created successfully! All previous bids have been invalidated.')
            return redirect('admin_panel:auction_detail', auction_id=auction.id)

        except Exception as e:
            messages.error(request, f'Error creating round: {str(e)}')
            return redirect('admin_panel:auction_detail', auction_id=auction.id)


class PromoBarManagementView(AdminRequiredMixin, TemplateView):
    """View for managing promo bar settings"""
    template_name = 'admin_panel/promobar_management.html'

    def get_context_data(self, **kwargs):
        from .models import PromoBarSettings

        context = super().get_context_data(**kwargs)

        # Get all promo bars (active and inactive)
        context['promo_bars'] = PromoBarSettings.objects.all()

        # Get active promo bar
        context['active_promo'] = PromoBarSettings.objects.filter(is_active=True).first()

        return context


class PromoBarCreateView(AdminRequiredMixin, View):
    """Create a new promo bar"""

    def post(self, request):
        from .models import PromoBarSettings

        try:
            # Create new promo bar
            promo_bar = PromoBarSettings.objects.create(
                brand_text=request.POST.get('brand_text', 'BIDSOKO LUXE'),
                brand_text_mobile=request.POST.get('brand_text_mobile', 'BIDSOKO'),
                brand_emoji=request.POST.get('brand_emoji', '🎯'),
                phone_number=request.POST.get('phone_number', '0711 011 011'),
                phone_emoji=request.POST.get('phone_emoji', '📞'),
                announcement_text=request.POST.get('announcement_text', '🚚 Free Delivery on Orders Over KES 5,000'),
                cta_text=request.POST.get('cta_text', 'SHOP NOW'),
                cta_link=request.POST.get('cta_link', '/browse'),
                background_color=request.POST.get('background_color', '#f9e5c9'),
                text_color=request.POST.get('text_color', '#1f2937'),
                accent_color=request.POST.get('accent_color', '#ea580c'),
                is_active=request.POST.get('is_active') == 'on'
            )

            messages.success(request, '✅ Promo bar created successfully!')

        except Exception as e:
            messages.error(request, f'Error creating promo bar: {str(e)}')

        return redirect('admin_panel:promobar_management')


class PromoBarUpdateView(AdminRequiredMixin, View):
    """Update an existing promo bar"""

    def post(self, request, promo_id):
        from .models import PromoBarSettings

        try:
            promo_bar = get_object_or_404(PromoBarSettings, id=promo_id)

            # Update fields
            promo_bar.brand_text = request.POST.get('brand_text', promo_bar.brand_text)
            promo_bar.brand_text_mobile = request.POST.get('brand_text_mobile', promo_bar.brand_text_mobile)
            promo_bar.brand_emoji = request.POST.get('brand_emoji', promo_bar.brand_emoji)
            promo_bar.phone_number = request.POST.get('phone_number', promo_bar.phone_number)
            promo_bar.phone_emoji = request.POST.get('phone_emoji', promo_bar.phone_emoji)
            promo_bar.announcement_text = request.POST.get('announcement_text', promo_bar.announcement_text)
            promo_bar.cta_text = request.POST.get('cta_text', promo_bar.cta_text)
            promo_bar.cta_link = request.POST.get('cta_link', promo_bar.cta_link)
            promo_bar.background_color = request.POST.get('background_color', promo_bar.background_color)
            promo_bar.text_color = request.POST.get('text_color', promo_bar.text_color)
            promo_bar.accent_color = request.POST.get('accent_color', promo_bar.accent_color)
            promo_bar.is_active = request.POST.get('is_active') == 'on'

            promo_bar.save()

            messages.success(request, '✅ Promo bar updated successfully!')

        except Exception as e:
            messages.error(request, f'Error updating promo bar: {str(e)}')

        return redirect('admin_panel:promobar_management')


class PromoBarDeleteView(AdminRequiredMixin, View):
    """Delete a promo bar"""

    def post(self, request, promo_id):
        from .models import PromoBarSettings

        try:
            promo_bar = get_object_or_404(PromoBarSettings, id=promo_id)
            promo_bar.delete()

            messages.success(request, '✅ Promo bar deleted successfully!')

        except Exception as e:
            messages.error(request, f'Error deleting promo bar: {str(e)}')

        return redirect('admin_panel:promobar_management')