from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    UserProfileSerializer
)

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user management
    - Registration (public)
    - Profile management (authenticated)
    - User listing (authenticated)
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'id'

    def get_permissions(self):
        """
        Allow public access for registration, require auth for everything else
        """
        if self.action == 'create':
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'create':
            return UserRegistrationSerializer
        elif self.action == 'update_profile':
            return UserProfileSerializer
        elif self.action == 'me':
            return UserSerializer  # ← FIXED: Now returns full user data with is_superuser
        return UserSerializer

    def create(self, request, *args, **kwargs):
        """
        POST /api/auth/users/
        Register a new user
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Return user data with 201 status
        user_serializer = UserSerializer(user)
        return Response(user_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        GET /api/auth/users/me/
        Get current authenticated user's profile
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_profile(self, request):
        """
        PATCH /api/auth/users/update_profile/
        Update current user's profile
        """
        serializer = self.get_serializer(
            request.user,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def stats(self, request):
        """
        GET /api/auth/users/stats/
        Get current user's statistics
        """
        user = request.user

        stats = {
            'user_type': user.user_type,
            'is_verified': user.is_verified,
            'wallet_balance': str(user.wallet_balance),
            'trust_score': user.trust_score,
            'auctions_won': user.auctions_won,
            'auctions_participated': user.auctions_participated,
            'total_spent': str(user.total_spent),
        }

        # Add seller-specific stats
        if user.user_type == 'seller':
            stats['auctions_created'] = user.created_auctions.count()
            stats['active_auctions'] = user.created_auctions.filter(status='active').count()

        return Response(stats)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def admin_list(self, request):
        """
        GET /api/auth/users/admin_list/
        List all users with filters and search (Admin only)
        """
        if not request.user.is_superuser:
            return Response(
                {'error': 'Only admins can view all users'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = User.objects.all().order_by('-date_joined')
        
        # Filter by user type
        user_type = request.query_params.get('user_type', None)
        if user_type:
            queryset = queryset.filter(user_type=user_type)
        
        # Filter by verification status
        is_verified = request.query_params.get('is_verified', None)
        if is_verified is not None:
            queryset = queryset.filter(is_verified=is_verified.lower() == 'true')
        
        # Search by username, email, or phone
        search = request.query_params.get('search', None)
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(phone_number__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        serializer = UserSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def admin_detail(self, request, id=None):
        """
        GET /api/auth/users/{id}/admin_detail/
        Get detailed user info including orders, bids, participations (Admin only)
        """
        if not request.user.is_superuser:
            return Response(
                {'error': 'Only admins can view user details'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user = self.get_object()
        
        # Get user's orders
        from auctions.models import Order, Bid, Participation
        orders = Order.objects.filter(user=user).order_by('-created_at')[:10]
        
        # Get user's bids
        bids = Bid.objects.filter(user=user).select_related('auction').order_by('-submitted_at')[:10]
        
        # Get user's participations
        participations = Participation.objects.filter(user=user).select_related('auction').order_by('-created_at')[:10]
        
        # Calculate stats
        from django.db.models import Sum, Count
        order_stats = Order.objects.filter(user=user, status__in=['paid', 'processing', 'shipped', 'delivered']).aggregate(
            total_orders=Count('id'),
            total_spent=Sum('total_amount')
        )
        
        data = {
            'user': UserSerializer(user).data,
            'recent_orders': [{
                'id': str(order.id),
                'order_number': order.order_number,
                'total_amount': str(order.total_amount),
                'status': order.status,
                'created_at': order.created_at,
            } for order in orders],
            'recent_bids': [{
                'id': str(bid.id),
                'auction_title': bid.auction.title,
                'pledge_amount': str(bid.pledge_amount),
                'submitted_at': bid.submitted_at,
            } for bid in bids],
            'recent_participations': [{
                'id': str(p.id),
                'auction_title': p.auction.title,
                'fee_paid': str(p.fee_paid),
                'paid_at': p.paid_at,
            } for p in participations],
            'stats': {
                'total_orders': order_stats['total_orders'] or 0,
                'total_spent': str(order_stats['total_spent'] or 0),
                'total_bids': bids.count(),
                'total_participations': participations.count(),
            }
        }
        
        return Response(data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def admin_stats(self, request):
        """
        GET /api/auth/users/admin_stats/
        Get overall user statistics (Admin only)
        """
        if not request.user.is_superuser:
            return Response(
                {'error': 'Only admins can view stats'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        total_users = User.objects.count()
        buyers = User.objects.filter(user_type='buyer').count()
        sellers = User.objects.filter(user_type='seller').count()
        admins = User.objects.filter(user_type='admin').count()
        verified = User.objects.filter(is_verified=True).count()
        
        # Get users registered in last 30 days
        from django.utils import timezone
        from datetime import timedelta
        thirty_days_ago = timezone.now() - timedelta(days=30)
        new_users = User.objects.filter(date_joined__gte=thirty_days_ago, is_superuser=False).count()
        
        return Response({
            'total_users': total_users,
            'buyers': buyers,
            'sellers': sellers,
            'admins': admins,
            'verified': verified,
            'new_users_last_30_days': new_users,
        })
