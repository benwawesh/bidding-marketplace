from django.views.generic import TemplateView, CreateView
from django.contrib.auth.mixins import LoginRequiredMixin
from auctions.models import Bid, Participation, Payment, Auction
from django.urls import reverse_lazy
from django.contrib.auth import get_user_model, login
from django.contrib import messages
from .forms import SignUpForm

User = get_user_model()


class SignUpView(CreateView):
    """User registration view"""
    model = User
    form_class = SignUpForm  # Use our custom form
    template_name = 'accounts/signup.html'
    success_url = reverse_lazy('home')

    def dispatch(self, request, *args, **kwargs):
        """Redirect if already logged in"""
        if request.user.is_authenticated:
            if request.user.user_type == 'seller':
                return redirect('admin_panel:dashboard')
            else:
                return redirect('home')
        return super().dispatch(request, *args, **kwargs)

    def form_valid(self, form):
        """Log user in after successful registration"""
        response = super().form_valid(form)
        user = self.object

        # Log the user in automatically
        login(self.request, user)

        # Add success message
        messages.success(self.request, f'Welcome to BidMarket, {user.username}! Your account has been created.')

        # Redirect based on user type
        if user.user_type == 'seller':
            self.success_url = reverse_lazy('admin_panel:dashboard')
        else:
            self.success_url = reverse_lazy('home')

        return response


class ProfileView(LoginRequiredMixin, TemplateView):
    """User profile view"""
    template_name = 'accounts/profile.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user

        # Get user statistics
        if user.user_type == 'seller':
            from auctions.models import Auction
            context['my_auctions'] = Auction.objects.filter(created_by=user).order_by('-created_at')[:5]
        else:
            from auctions.models import Bid
            context['my_bids'] = Bid.objects.filter(user=user, is_valid=True).order_by('-submitted_at')[:5]

        return context


class DashboardView(LoginRequiredMixin, TemplateView):
    """User dashboard showing bids, payments, and stats"""
    template_name = 'accounts/dashboard.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user

        # Active bids (auctions still active)
        active_bids = Bid.objects.filter(
            user=user,
            is_valid=True,
            auction__status='active'
        ).select_related('auction', 'round').order_by('-submitted_at')

        # All bids history
        all_bids = Bid.objects.filter(
            user=user
        ).select_related('auction', 'round').order_by('-submitted_at')[:10]

        # Won auctions
        won_auctions = Auction.objects.filter(
            winner=user,
            status='closed'
        ).select_related('category').order_by('-updated_at')

        # Participations
        participations = Participation.objects.filter(
            user=user,
            payment_status='completed'
        ).select_related('auction', 'round').order_by('-created_at')[:10]

        # Payments
        payments = Payment.objects.filter(
            user=user
        ).select_related('auction').order_by('-created_at')[:10]

        # Statistics
        from django.db.models import Count, Sum
        total_bids = Bid.objects.filter(user=user).count()
        total_spent = Payment.objects.filter(
            user=user,
            status='completed'
        ).aggregate(total=Sum('amount'))['total'] or 0

        auctions_won = won_auctions.count()
        auctions_participated = Participation.objects.filter(
            user=user,
            payment_status='completed'
        ).values('auction').distinct().count()

        context.update({
            'active_bids': active_bids,
            'all_bids': all_bids,
            'won_auctions': won_auctions,
            'participations': participations,
            'payments': payments,
            'stats': {
                'total_bids': total_bids,
                'total_spent': total_spent,
                'auctions_won': auctions_won,
                'auctions_participated': auctions_participated,
            }
        })

        return context