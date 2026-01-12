from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, IsAdminUser
from django.db.models import Q, Max, Count, Sum, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Auction, Category, Bid, Round, Participation, HeroBanner, SpecialOfferBanner
from accounts.models import User
from .serializers import (
    AuctionListSerializer, AuctionDetailSerializer, AuctionCreateSerializer,
    CategorySerializer, BidSerializer, RoundSerializer, ParticipationSerializer,
    HeroBannerSerializer, SpecialOfferBannerSerializer,
)
from decimal import Decimal, InvalidOperation



class AuctionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing auctions (products)
    """
    queryset = Auction.objects.all().select_related('category', 'created_by')
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'id'

    def get_serializer_class(self):
        """Use different serializers for list/detail/create"""
        if self.action == 'list':
            return AuctionListSerializer
        elif self.action == 'create':
            return AuctionCreateSerializer
        return AuctionDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by category
        category_id = self.request.query_params.get('category', None)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        # Filter by product type
        product_type = self.request.query_params.get('product_type', None)
        if product_type:
            queryset = queryset.filter(product_type=product_type)
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Search
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(description__icontains=search)
            )
        
        return queryset.order_by('-created_at')

    def perform_update(self, serializer):
        """Handle music removal when remove_music flag is set"""
        # Check if remove_music flag is set (indicates admin wants to remove music)
        if self.request.data.get('remove_music') == 'true':
            instance = self.get_object()
            # Delete the existing file if it exists
            if instance.background_music:
                instance.background_music.delete(save=False)
            # Set to None/null and save
            instance.background_music = None
            instance.save()
        else:
            # Normal update - let serializer handle it
            serializer.save()

    @action(detail=True, methods=['get'])
    def leaderboard(self, request, id=None):
        """Get top bids for an auction"""
        auction = self.get_object()
        current_round = auction.get_current_round()
        
        if not current_round:
            return Response({
                'top_bids': [],
                'total_participants': 0,
                'highest_amount': 0
            })

        top_bids = current_round.bids.filter(
            is_valid=True
        ).select_related('user').order_by(
            '-pledge_amount',
            'submitted_at'
        )[:10]

        serialized_bids = BidSerializer(top_bids, many=True).data
        
        return Response({
            'top_bids': serialized_bids,
            'total_participants': current_round.bids.filter(is_valid=True).count(),
            'highest_amount': top_bids.first().pledge_amount if top_bids else 0
        })

    @action(detail=True, methods=['get'])
    def rounds(self, request, id=None):
        """Get all rounds for an auction"""
        auction = self.get_object()
        rounds = auction.rounds.all().order_by('round_number')
        serializer = RoundSerializer(rounds, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def activate(self, request, id=None):
        """Activate a draft product (Admin only) - Admin sets min/max pledge range for auctions"""
        auction = self.get_object()

        # Check if user is admin
        if not request.user.is_superuser:
            return Response(
                {'error': 'Only admins can activate products'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if already active
        if auction.status == 'active':
            return Response(
                {'error': 'Product is already active'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # For buy_now products, simply activate without pledge requirements
        if auction.product_type == 'buy_now':
            auction.status = 'active'
            auction.save()
            return Response({
                'message': 'Buy Now product activated successfully!',
                'auction': AuctionDetailSerializer(auction).data
            })

        # For auction and both types, use min_pledge and max_pledge from the product
        # Check if they are set on the product
        if not auction.min_pledge or not auction.max_pledge:
            return Response(
                {'error': 'min_pledge and max_pledge must be set on the product before activation'},
                status=status.HTTP_400_BAD_REQUEST
            )

        min_pledge = float(auction.min_pledge)
        max_pledge = float(auction.max_pledge)

        # Validate
        if min_pledge < float(auction.base_price):
            return Response(
                {'error': f'min_pledge cannot be less than base price ({auction.base_price})'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if max_pledge <= min_pledge:
            return Response(
                {'error': 'max_pledge must be greater than min_pledge'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Activate the auction
        auction.status = 'active'
        auction.save()

        # Auto-create Round 1 if no rounds exist
        if not auction.rounds.exists():
            now = timezone.now()
            one_year = timezone.timedelta(days=365)

            Round.objects.create(
                auction=auction,
                round_number=1,
                base_price=auction.base_price,
                min_pledge=min_pledge,
                max_pledge=max_pledge,
                participation_fee=auction.participation_fee,
                start_time=now,
                end_time=now + one_year,
                is_active=True
            )

        return Response({
            'message': f'Auction activated! Buyers can bid between {min_pledge} - {max_pledge}',
            'auction': AuctionDetailSerializer(auction).data
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def close(self, request, id=None):
        """Close an auction and determine winner (Admin only)"""
        auction = self.get_object()
        
        # Check if user is admin
        if not request.user.is_superuser:
            return Response(
                {'error': 'Only admins can close auctions'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if auction is active
        if auction.status != 'active':
            return Response(
                {'error': 'Only active auctions can be closed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get current round
        current_round = auction.get_current_round()
        if not current_round:
            return Response(
                {'error': 'No active round found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get highest bid
        highest_bid = current_round.bids.filter(
            is_valid=True
        ).order_by('-pledge_amount', 'submitted_at').first()
        
        if not highest_bid:
            return Response(
                {'error': 'No valid bids found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Close auction
        auction.status = 'closed'
        auction.winner = highest_bid.user
        auction.winning_amount = highest_bid.pledge_amount
        auction.save()
        
        # Mark winning bid
        highest_bid.is_winner = True
        highest_bid.save()
        
        return Response({
            'message': 'Auction closed successfully',
            'winner': {
                'username': highest_bid.user.username,
                'amount': str(highest_bid.pledge_amount)
            }
        })

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def participants(self, request, id=None):
        """Get all participants who paid entry fee for this auction (Admin only)"""
        auction = self.get_object()
        
        if not request.user.is_superuser:
            return Response(
                {'error': 'Only admins can view participants'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        current_round = auction.get_current_round()
        if not current_round:
            return Response({
                'participants': [],
                'total_count': 0,
                'total_revenue': 0
            })
        
        participants = Participation.objects.filter(
            auction=auction,
            round=current_round,
            payment_status='completed'
        ).select_related('user').order_by('-paid_at')
        
        from .serializers import ParticipantDetailSerializer
        serializer = ParticipantDetailSerializer(participants, many=True)
        
        from decimal import Decimal
        total_revenue = participants.aggregate(
            total=Sum('fee_paid')
        )['total'] or Decimal('0.00')
        
        return Response({
            'participants': serializer.data,
            'total_count': participants.count(),
            'total_revenue': str(total_revenue),
            'round_number': current_round.round_number
        })

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def bids_list(self, request, id=None):
        """Get all bids ranked for this auction (Admin only)"""
        auction = self.get_object()
        
        if not request.user.is_superuser:
            return Response(
                {'error': 'Only admins can view all bids'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        current_round = auction.get_current_round()
        if not current_round:
            return Response({
                'bids': [],
                'total_count': 0
            })
        
        bids = current_round.bids.filter(
            is_valid=True
        ).select_related('user').order_by(
            '-pledge_amount',
            'submitted_at'
        )
        
        bids_with_position = []
        for index, bid in enumerate(bids, start=1):
            bid.position = index
            bids_with_position.append(bid)
        
        from .serializers import BidDetailSerializer
        serializer = BidDetailSerializer(bids_with_position, many=True)
        
        return Response({
            'bids': serializer.data,
            'total_count': bids.count(),
            'round_number': current_round.round_number,
            'highest_amount': str(bids.first().pledge_amount) if bids.exists() else '0'
        })

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def revenue_summary(self, request, id=None):
        """Get revenue summary for this auction (Admin only)"""
        auction = self.get_object()
        
        if not request.user.is_superuser:
            return Response(
                {'error': 'Only admins can view revenue'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from decimal import Decimal
        
        all_participations = Participation.objects.filter(
            auction=auction,
            payment_status='completed'
        )
        
        rounds_revenue = []
        for round_obj in auction.rounds.all().order_by('round_number'):
            round_participations = all_participations.filter(round=round_obj)
            round_total = round_participations.aggregate(
                total=Sum('fee_paid')
            )['total'] or Decimal('0.00')
            
            rounds_revenue.append({
                'round_number': round_obj.round_number,
                'participants': round_participations.count(),
                'revenue': str(round_total)
            })
        
        total_revenue = all_participations.aggregate(
            total=Sum('fee_paid')
        )['total'] or Decimal('0.00')
        
        return Response({
            'auction_id': str(auction.id),
            'auction_title': auction.title,
            'total_participants': all_participations.values('user').distinct().count(),
            'total_revenue': str(total_revenue),
            'rounds': rounds_revenue
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def create_next_round(self, request, id=None):
        """
        Admin-only: Create the next bidding round for this auction.
        Each new round can have a new base_price and participation_fee.
        """
        auction = self.get_object()

        # ✅ Ensure only admins can create new rounds
        if not request.user.is_superuser:
            return Response(
                {'error': 'Only admins can create new rounds.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # ✅ Ensure auction is still active
        if auction.status != 'active':
            return Response(
                {'error': 'Only active auctions can have new rounds.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Get the most recent round
        last_round = auction.rounds.order_by('-round_number').first()
        next_round_number = 1 if not last_round else last_round.round_number + 1

        # ✅ Extract data from the request
        base_price = request.data.get('base_price')
        participation_fee = request.data.get('participation_fee')
        min_pledge = request.data.get('min_pledge')
        max_pledge = request.data.get('max_pledge')
        duration_days = request.data.get('duration_days', 7)  # Default: 7 days

        # ✅ Validate required fields
        missing_fields = [
            field for field in ['base_price', 'participation_fee', 'min_pledge', 'max_pledge']
            if request.data.get(field) is None
        ]
        if missing_fields:
            return Response(
                {'error': f"Missing fields: {', '.join(missing_fields)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            base_price = Decimal(base_price)
            participation_fee = Decimal(participation_fee)
            min_pledge = Decimal(min_pledge)
            max_pledge = Decimal(max_pledge)
        except (InvalidOperation, TypeError):
            return Response(
                {'error': 'base_price, participation_fee, min_pledge, and max_pledge must be valid decimal numbers.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Ensure new base price is not lower than previous
        if last_round and base_price < last_round.base_price:
            return Response(
                {'error': f'New base price ({base_price}) cannot be lower than previous round ({last_round.base_price}).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Ensure pledge range is valid
        if min_pledge < base_price:
            return Response(
                {'error': f'min_pledge cannot be lower than base_price ({base_price}).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if max_pledge <= min_pledge:
            return Response(
                {'error': 'max_pledge must be greater than min_pledge.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Auto-close previous round (if active)
        if last_round and last_round.is_active:
            last_round.is_active = False
            last_round.save(update_fields=['is_active'])

        # ✅ Create the new round
        now = timezone.now()
        end_time = now + timezone.timedelta(days=int(duration_days))

        new_round = Round.objects.create(
            auction=auction,
            round_number=next_round_number,
            base_price=base_price,
            min_pledge=min_pledge,
            max_pledge=max_pledge,
            participation_fee=participation_fee,
            start_time=now,
            end_time=end_time,
            is_active=True
        )

        return Response({
            'message': f'Round {next_round_number} created successfully for auction "{auction.title}".',
            'round': RoundSerializer(new_round).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def winner_calculation(self, request, id=None):
        """
        Calculate and return winner based on average pledge across ALL rounds.
        Users who didn't participate in a round get 0 for that round.
        Average = (sum of all pledges) / (total number of rounds)
        """
        auction = self.get_object()

        if not request.user.is_superuser:
            return Response(
                {'error': 'Only admins can view winner calculations'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get all rounds for this auction
        rounds = auction.rounds.all().order_by('round_number')
        total_rounds = rounds.count()

        if total_rounds == 0:
            return Response({
                'error': 'No rounds created yet',
                'total_rounds': 0,
                'participants': []
            })

        # Get all users who participated in at least one round
        from django.db.models import Q
        participant_users = User.objects.filter(
            Q(bids__auction=auction, bids__is_valid=True) |
            Q(participations__auction=auction, participations__payment_status='completed')
        ).distinct()

        # Calculate average for each user
        user_calculations = []

        for user in participant_users:
            round_details = []
            total_pledge = Decimal('0.00')
            rounds_participated = 0

            for round_obj in rounds:
                # Get user's latest valid bid for this round
                bid = Bid.objects.filter(
                    user=user,
                    round=round_obj,
                    is_valid=True
                ).order_by('-submitted_at').first()

                if bid:
                    pledge_amount = bid.pledge_amount
                    total_pledge += pledge_amount
                    rounds_participated += 1
                    participated = True
                else:
                    pledge_amount = Decimal('0.00')
                    participated = False

                round_details.append({
                    'round_number': round_obj.round_number,
                    'pledge_amount': str(pledge_amount),
                    'participated': participated
                })

            # Calculate average: total_pledge / total_rounds (not rounds_participated!)
            average_pledge = total_pledge / total_rounds if total_rounds > 0 else Decimal('0.00')

            user_calculations.append({
                'user': {
                    'id': str(user.id),
                    'username': user.username,
                    'full_name': f"{user.first_name} {user.last_name}".strip(),
                    'email': user.email,
                    'phone_number': getattr(user, 'phone_number', None),
                },
                'total_pledge': str(total_pledge),
                'rounds_participated': rounds_participated,
                'total_rounds': total_rounds,
                'average_pledge': str(average_pledge),
                'round_details': round_details
            })

        # Sort by average pledge (descending)
        user_calculations.sort(key=lambda x: Decimal(x['average_pledge']), reverse=True)

        # Determine winner
        winner = user_calculations[0] if user_calculations else None

        return Response({
            'auction': {
                'id': str(auction.id),
                'title': auction.title,
                'status': auction.status
            },
            'total_rounds': total_rounds,
            'total_participants': len(user_calculations),
            'winner': winner,
            'all_participants': user_calculations
        })



class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'id'
    
    def get_queryset(self):

        if self.request.user.is_authenticated and self.request.user.is_superuser:
            return Category.objects.all().order_by('name')
        return Category.objects.filter(is_active=True).order_by('name')

        # ✅ Add this method here

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("❌ Serializer Errors:", serializer.errors)  # Will show cause of 400
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def perform_create(self, serializer):
        import logging
        logger = logging.getLogger(__name__)
        
        logger.warning(f"CREATE CATEGORY - User: {self.request.user}")
        logger.warning(f"CREATE CATEGORY - Is superuser: {self.request.user.is_superuser}")
        logger.warning(f"CREATE CATEGORY - Request data: {self.request.data}")
        logger.warning(f"CREATE CATEGORY - Request FILES: {self.request.FILES}")
        
        if not self.request.user.is_superuser:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can create categories")
        
        # Auto-generate slug from name if not provided
        name = serializer.validated_data.get('name', '')
        if not serializer.validated_data.get('slug'):
            from django.utils.text import slugify
            serializer.validated_data['slug'] = slugify(name)
        
        logger.warning(f"CREATE CATEGORY - About to save: {serializer.validated_data}")
        serializer.save()
        logger.warning(f"CREATE CATEGORY - Saved successfully!")
    

    def perform_update(self, serializer):
        """Only superusers can update categories"""
        if not self.request.user.is_superuser:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can update categories")
        serializer.save()

    @action(detail=True, methods=['get'])
    def products(self, request, slug=None):
        """Return all products under a specific category"""
        category = self.get_object()
        products = Auction.objects.filter(category=category, is_active=True)
        serializer = AuctionListSerializer(products, many=True)
        return Response(serializer.data)

    def perform_destroy(self, instance):
        """Only superusers can delete - soft delete by setting is_active=False"""
        if not self.request.user.is_superuser:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can delete categories")
        
        # Soft delete - don't actually remove from database
        instance.is_active = False
        instance.save()
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def toggle_active(self, request, id=None):
        """Toggle category active status (Admin only)"""
        if not request.user.is_superuser:
            return Response(
                {'error': 'Only admins can toggle category status'},
                status=status.HTTP_403_FORBIDDEN
            )

        category = self.get_object()
        category.is_active = not category.is_active
        category.save()

        return Response({
            'message': f'Category {"activated" if category.is_active else "deactivated"}',
            'category': CategorySerializer(category).data
        })

    @action(detail=True, methods=['get'])
    def products(self, request, id=None):
        """Return all products under a specific category"""
        try:
            category = self.get_object()
        except:
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)

        # Get only active auctions under this category
        products = Auction.objects.filter(category=category, is_active=True)
        serializer = AuctionSerializer(products, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class BidViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing bids (pledge amounts)
    LIST: GET /api/bids/
    CREATE: POST /api/bids/
    """
    serializer_class = BidSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        """Users can only see their own bids or public leaderboard"""
        if self.request.user.is_authenticated:
            return Bid.objects.filter(user=self.request.user).select_related('auction', 'round')
        return Bid.objects.none()

    def create(self, request, *args, **kwargs):
        """
        Create a new bid with payment verification + INSTANT WebSocket broadcast
        """
        auction_id = request.data.get('auction')
        pledge_amount = request.data.get('pledge_amount')

        if not auction_id or not pledge_amount:
            return Response(
                {'error': 'auction and pledge_amount are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Get auction
            auction = Auction.objects.get(id=auction_id)

            # Check if auction is active
            if auction.status != 'active':
                return Response(
                    {'error': 'Auction is not active'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get current round
            current_round = auction.get_current_round()
            if not current_round:
                return Response(
                    {'error': 'No active round for this auction'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # CRITICAL: Check if user has paid participation fee
            participation = Participation.objects.filter(
                user=request.user,
                auction=auction,
                round=current_round,
                payment_status='completed'
            ).first()

            if not participation:
                return Response(
                    {'error': 'You must pay the participation fee first'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Validate pledge amount
            pledge_amount = float(pledge_amount)
            if pledge_amount < current_round.min_pledge:
                return Response(
                    {'error': f'Minimum pledge is {current_round.min_pledge}'},
                    status=status.HTTP_400_BAD_REQUEST
                )


            # Enforce maximum pledge
            if pledge_amount > current_round.max_pledge:
                return Response(
                    {'error': f'Maximum pledge is {current_round.max_pledge}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Check if user already has a bid
            existing_bid = Bid.objects.filter(
                user=request.user,
                round=current_round,
                is_valid=True
            ).first()

            if existing_bid:
                # Update existing bid
                existing_bid.pledge_amount = pledge_amount
                existing_bid.submitted_at = timezone.now()
                existing_bid.save()
                bid = existing_bid
                message = 'Bid updated successfully'
            else:
                # Create new bid
                bid = Bid.objects.create(
                    user=request.user,
                    auction=auction,
                    round=current_round,
                    pledge_amount=pledge_amount,
                    is_valid=True
                )
                message = 'Bid placed successfully'

            # 🚀 INSTANT WEBSOCKET BROADCAST
            channel_layer = get_channel_layer()

            # Get fresh leaderboard data (now includes position and is_current_user)
            leaderboard_data = self._get_leaderboard_data(auction, current_round, request.user.id)

            # Broadcast to all connected clients
            async_to_sync(channel_layer.group_send)(
                f'auction_{auction_id}',
                {
                    'type': 'leaderboard_update',
                    'data': leaderboard_data
                }
            )

            return Response({
                'message': message,
                'bid': BidSerializer(bid).data
            }, status=status.HTTP_201_CREATED)

        except Auction.DoesNotExist:
            return Response(
                {'error': 'Auction not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _get_leaderboard_data(self, auction, current_round, current_user_id=None):
        """
        Helper method to get leaderboard data for WebSocket broadcast
        ✅ NOW INCLUDES: position, is_current_user fields
        """
        # Get all valid bids, ordered by amount and time
        all_bids = current_round.bids.filter(
            is_valid=True
        ).select_related('user').order_by(
            '-pledge_amount',
            'submitted_at'
        )

        # Get top bids
        top_bids = all_bids[:10]  # Only top 10 for display
        serialized_bids = []

        for index, bid in enumerate(top_bids, start=1):
            serialized_bids.append({
                'id': str(bid.id),
                'position': index,  # ✅ ADDED
                'is_current_user': str(bid.user.id) == str(current_user_id) if current_user_id else False,  # ✅ ADDED
                'user': {
                    'id': str(bid.user.id),
                    'username': bid.user.username,
                    'first_name': bid.user.first_name or bid.user.username,
                },
                'pledge_amount': str(bid.pledge_amount),
                'submitted_at': bid.submitted_at.isoformat(),
            })

        highest_bid = top_bids.first() if top_bids else None
        highest_amount = highest_bid.pledge_amount if highest_bid else 0

        tied_at_top = all_bids.filter(
            pledge_amount=highest_amount
        ).count() if highest_amount > 0 else 0

        # Check if current user is in top 10
        user_in_top_10 = False
        user_position = None
        user_bid = None
        
        if current_user_id:
            user_bid_obj = all_bids.filter(user_id=current_user_id).first()
            if user_bid_obj:
                # Find user's position in all bids
                all_bid_ids = list(all_bids.values_list('id', flat=True))
                user_position = all_bid_ids.index(user_bid_obj.id) + 1
                user_in_top_10 = user_position <= 10
                
                if not user_in_top_10:
                    user_bid = {
                        'pledge_amount': str(user_bid_obj.pledge_amount),
                        'position': user_position
                    }

        return {
            'top_bids': serialized_bids,
            'total_participants': all_bids.count(),
            'highest_amount': str(highest_amount),
            'tied_at_top_count': tied_at_top,
            'round_number': current_round.round_number,
            'round_base_price': str(current_round.base_price),
            'user_position': user_position,  # ✅ ADDED
            'user_bid': user_bid,  # ✅ ADDED
            'user_in_top_10': user_in_top_10,  # ✅ ADDED
        }


class ParticipationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing participation (entry fee payments)
    """
    serializer_class = ParticipationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Users can only see their own participations"""
        if self.request.user.is_authenticated:
            return Participation.objects.filter(user=self.request.user)
        return Participation.objects.none()

    @action(detail=False, methods=['get'])
    def my_participations(self, request):
        """Get current user's participations - CUSTOM ACTION FOR FRONTEND"""
        participations = Participation.objects.filter(user=request.user)
        serializer = ParticipationSerializer(participations, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """Create participation record (entry fee payment) - MATCHES FRONTEND FORMAT"""
        auction_id = request.data.get('auction')
        round_id = request.data.get('round')
        fee_paid = request.data.get('fee_paid')
        payment_status = request.data.get('payment_status', 'completed')

        if not all([auction_id, round_id, fee_paid]):
            return Response(
                {'error': 'auction, round, and fee_paid are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            auction = Auction.objects.get(id=auction_id)
            round_obj = Round.objects.get(id=round_id, auction=auction)

            # CRITICAL: Check if round is active
            if not round_obj.is_active:
                return Response(
                    {'error': 'This round is closed. No new participants allowed.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if already participated
            existing = Participation.objects.filter(
                user=request.user,
                auction=auction,
                round=round_obj
            ).first()

            if existing and existing.payment_status == 'completed':
                return Response(
                    {'error': 'You have already paid for this auction'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create or update participation
            participation, created = Participation.objects.update_or_create(
                user=request.user,
                auction=auction,
                round=round_obj,
                defaults={
                    'fee_paid': fee_paid,
                    'payment_status': payment_status,
                    'paid_at': timezone.now() if payment_status == 'completed' else None
                }
            )

            return Response({
                'message': 'Payment successful! You can now place bids.',
                'participation': ParticipationSerializer(participation).data
            }, status=status.HTTP_201_CREATED)

        except (Auction.DoesNotExist, Round.DoesNotExist):
            return Response(
                {'error': 'Auction or Round not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for payment transactions
    """
    from .models import Payment
    from .serializers import PaymentSerializer
    
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Users can only see their own payments"""
        if self.request.user.is_authenticated:
            from .models import Payment
            return Payment.objects.filter(user=self.request.user).order_by('-created_at')
        from .models import Payment
        return Payment.objects.none()


class CartViewSet(viewsets.ViewSet):
    """
    ViewSet for shopping cart operations
    """
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """Get user's cart"""
        from .models import Cart
        from .serializers import CartSerializer
        
        cart, created = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def add(self, request):
        """Add item to cart"""
        from .models import Cart, Auction
        from django.core.exceptions import ValidationError
        
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        
        if not product_id:
            return Response(
                {'error': 'product_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            product = Auction.objects.get(id=product_id)
            
            # Validate product type
            if product.product_type not in ['buy_now', 'both']:
                return Response(
                    {'error': 'Only buy_now or both products can be added to cart'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get or create cart
            cart, created = Cart.objects.get_or_create(user=request.user)
            
            # Add item using Cart method
            cart.add_item(product, quantity)
            
            from .serializers import CartSerializer
            cart_serializer = CartSerializer(cart)
            return Response({
                'message': 'Item added to cart',
                'cart': cart_serializer.data
            })
            
        except Auction.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def update_quantity(self, request):
        """Update item quantity in cart"""
        from .models import Cart, Auction, CartItem
        
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity')
        
        if not product_id or quantity is None:
            return Response(
                {'error': 'product_id and quantity are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            quantity = int(quantity)
            product = Auction.objects.get(id=product_id)
            cart = Cart.objects.get(user=request.user)
            
            if quantity <= 0:
                # Remove item
                CartItem.objects.filter(cart=cart, product=product).delete()
            else:
                # Update quantity
                cart_item = CartItem.objects.filter(cart=cart, product=product).first()
                if cart_item:
                    # Check stock
                    if product.stock_quantity and quantity > product.stock_quantity:
                        return Response(
                            {'error': f'Only {product.stock_quantity} units available'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    cart_item.quantity = quantity
                    cart_item.save()
            
            from .serializers import CartSerializer
            cart_serializer = CartSerializer(cart)
            return Response({
                'message': 'Cart updated',
                'cart': cart_serializer.data
            })
            
        except (Auction.DoesNotExist, Cart.DoesNotExist):
            return Response(
                {'error': 'Product or cart not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def remove(self, request):
        """Remove item from cart"""
        from .models import Cart, CartItem
        
        item_id = request.data.get('item_id')
        if not item_id:
            return Response({'error': 'item_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            cart = Cart.objects.get(user=request.user)
            item = CartItem.objects.get(id=item_id, cart=cart)
            item.delete()
            
            from .serializers import CartSerializer
            serializer = CartSerializer(cart)
            return Response({
                'message': 'Item removed',
                'cart': serializer.data
            })
        except (Cart.DoesNotExist, CartItem.DoesNotExist):
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'])
    def clear(self, request):
        """Clear cart"""
        from .models import Cart
        
        try:
            cart = Cart.objects.get(user=request.user)
            cart.clear()
            
            from .serializers import CartSerializer
            serializer = CartSerializer(cart)
            return Response({
                'message': 'Cart cleared',
                'cart': serializer.data
            })
        except Cart.DoesNotExist:
            return Response({'message': 'Cart is already empty'})



class OrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for order management (Admin + User)
    """
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        """Admin sees all orders, users see only their paid orders"""
        if self.request.user.is_superuser:
            from .models import Order
            return Order.objects.all().select_related('user').prefetch_related('items').order_by('-created_at')
        from .models import Order
        # Users only see orders that have been paid for
        return Order.objects.filter(user=self.request.user, payment_status='paid').order_by('-created_at')

    def get_serializer_class(self):
        """Use different serializers for create vs list/retrieve"""
        if self.action == 'create':
            from .serializers import CreateOrderSerializer
            return CreateOrderSerializer
        if self.request.user.is_superuser:
            from .serializers import OrderAdminSerializer
            return OrderAdminSerializer
        from .serializers import OrderSerializer
        return OrderSerializer

    def create(self, request, *args, **kwargs):
        """Create order from cart"""
        from .serializers import CreateOrderSerializer, OrderSerializer

        serializer = CreateOrderSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            order = serializer.save()
            order_serializer = OrderSerializer(order)
            return Response(order_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        """Update order (Admin only - for status updates)"""
        if not request.user.is_superuser:
            return Response(
                {'error': 'Only admins can update orders'},
                status=status.HTTP_403_FORBIDDEN
            )

        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        # Only allow certain fields to be updated
        allowed_fields = ['status', 'admin_notes']
        update_data = {k: v for k, v in request.data.items() if k in allowed_fields}

        if 'status' in update_data:
            valid_statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
            if update_data['status'] not in valid_statuses:
                return Response(
                    {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        for field, value in update_data.items():
            setattr(instance, field, value)

        instance.save()

        from .serializers import OrderAdminSerializer
        serializer = OrderAdminSerializer(instance)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        """Partial update of order (Admin only)"""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_status(self, request, id=None):
        """Update order status (Admin only)"""
        if not request.user.is_superuser:
            return Response(
                {'error': 'Only admins can update order status'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        order = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            return Response(
                {'error': 'Status is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate status
        valid_statuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = new_status
        
        # Update admin notes if provided
        if 'admin_notes' in request.data:
            order.admin_notes = request.data['admin_notes']
        
        order.save()
        
        from .serializers import OrderAdminSerializer
        serializer = OrderAdminSerializer(order)
        return Response({
            'message': f'Order status updated to {new_status}',
            'order': serializer.data
        })

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def stats(self, request):
        """Get order statistics (Admin only)"""
        if not request.user.is_superuser:
            return Response(
                {'error': 'Only admins can view stats'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from decimal import Decimal
        from .models import Order
        
        all_orders = Order.objects.all()
        
        stats = {
            'total_orders': all_orders.count(),
            'pending': all_orders.filter(status='pending').count(),
            'paid': all_orders.filter(status='paid').count(),
            'processing': all_orders.filter(status='processing').count(),
            'shipped': all_orders.filter(status='shipped').count(),
            'delivered': all_orders.filter(status='delivered').count(),
            'cancelled': all_orders.filter(status='cancelled').count(),
            'total_revenue': str(all_orders.filter(
                status__in=['paid', 'processing', 'shipped', 'delivered']
            ).aggregate(total=models.Sum('total_amount'))['total'] or Decimal('0.00'))
        }
        
        return Response(stats)


class CustomerViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for customer management (Admin only)
    """
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        """Only admins can access"""
        if not self.request.user.is_superuser:
            from accounts.models import User
            return User.objects.none()
        
        from accounts.models import User
        return User.objects.filter(is_superuser=False).order_by('-date_joined')
    
    def get_serializer_class(self):
        from .serializers import CustomerSerializer
        return CustomerSerializer
    
    def list(self, request, *args, **kwargs):
        """List all customers with stats"""
        if not request.user.is_superuser:
            return Response(
                {'error': 'Only admins can view customers'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().list(request, *args, **kwargs)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def buyers(self, request, id=None):
        """Get all buyers who purchased this buy_now product (Admin only)"""
        auction = self.get_object()
        
        if not request.user.is_superuser:
            return Response(
                {'error': 'Only admins can view buyers'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if it's a buy_now product
        if auction.product_type not in ['buy_now', 'both']:
            return Response(
                {'error': 'This endpoint is only for buy_now products'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from .models import Order, OrderItem
        
        # Get all orders containing this product
        order_items = OrderItem.objects.filter(
            product=auction
        ).select_related('order', 'order__user').order_by('-order__created_at')
        
        buyers_data = []
        total_revenue = 0
        total_units = 0
        
        for item in order_items:
            order = item.order
            total_revenue += item.total_price
            total_units += item.quantity
            
            buyers_data.append({
                'id': str(order.id),
                'order_number': order.order_number,
                'customer': {
                    'id': str(order.user.id),
                    'username': order.user.username,
                    'email': order.user.email,
                    'phone': order.user.phone if hasattr(order.user, 'phone') else None,
                },
                'shipping_name': order.shipping_name,
                'shipping_phone': order.shipping_phone,
                'shipping_address': order.shipping_address,
                'shipping_city': order.shipping_city,
                'quantity': item.quantity,
                'price_per_unit': str(item.product_price),
                'total_price': str(item.total_price),
                'order_status': order.status,
                'payment_status': order.payment_status,
                'created_at': order.created_at,
                'paid_at': order.paid_at,
            })
        
        return Response({
            'buyers': buyers_data,
            'total_orders': order_items.count(),
            'total_units_sold': total_units,
            'total_revenue': str(total_revenue),
        })

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def sales_stats(self, request, id=None):
        """Get sales statistics for buy_now product (Admin only)"""
        auction = self.get_object()
        
        if not request.user.is_superuser:
            return Response(
                {'error': 'Only admins can view sales stats'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if auction.product_type not in ['buy_now', 'both']:
            return Response(
                {'error': 'This endpoint is only for buy_now products'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from .models import OrderItem
        from decimal import Decimal
        
        # Get all order items for this product
        order_items = OrderItem.objects.filter(product=auction)
        
        # Calculate stats
        total_orders = order_items.count()
        total_units = sum(item.quantity for item in order_items)
        total_revenue = sum(item.total_price for item in order_items)
        
        # Get orders by status
        from .models import Order
        orders = Order.objects.filter(items__product=auction).distinct()
        
        stats_by_status = {
            'pending': orders.filter(status='pending').count(),
            'paid': orders.filter(status='paid').count(),
            'processing': orders.filter(status='processing').count(),
            'shipped': orders.filter(status='shipped').count(),
            'delivered': orders.filter(status='delivered').count(),
            'cancelled': orders.filter(status='cancelled').count(),
        }
        
        return Response({
            'product_id': str(auction.id),
            'product_title': auction.title,
            'buy_now_price': str(auction.buy_now_price),
            'stock_quantity': auction.stock_quantity,
            'units_sold': auction.units_sold,
            'total_orders': total_orders,
            'total_units_sold': total_units,
            'total_revenue': str(total_revenue),
            'average_order_value': str(total_revenue / total_orders if total_orders > 0 else 0),
            'orders_by_status': stats_by_status,
        })



class RoundViewSet(viewsets.ModelViewSet):
    queryset = Round.objects.select_related('auction').all()
    serializer_class = RoundSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'id'

    def perform_create(self, serializer):
        """Auto-increment round_number when creating a new round"""
        auction = serializer.validated_data['auction']
        last_round = auction.rounds.order_by('-round_number').first()
        next_round_number = (last_round.round_number + 1) if last_round else 1
        serializer.save(round_number=next_round_number)

    def get_queryset(self):
        queryset = super().get_queryset()
        auction_id = self.request.query_params.get('auction', None)
        if auction_id:
            queryset = queryset.filter(auction_id=auction_id)
        return queryset.order_by('round_number')

    # -------------------- Close Round --------------------
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def close(self, request, id=None):
        from django.db.models import Avg
        from django.contrib.auth import get_user_model
        User = get_user_model()

        round_obj = self.get_object()
        auction = round_obj.auction

        if not request.user.is_superuser:
            return Response({'error': 'Only admins can close rounds'}, status=status.HTTP_403_FORBIDDEN)

        if not round_obj.is_active:
            return Response({'error': 'Round is already closed'}, status=status.HTTP_400_BAD_REQUEST)

        # Close the current round
        round_obj.is_active = False
        round_obj.save()

        # Calculate winner based on AVERAGE across ALL rounds
        # CRITICAL: Average is sum of all bids divided by TOTAL NUMBER OF ROUNDS (not just participated rounds)
        from django.db.models import Sum

        # Get total number of rounds for this auction
        total_rounds = auction.rounds.count()

        # Get all users who have placed bids
        user_bids = Bid.objects.filter(
            auction=auction,
            is_valid=True
        ).values('user').annotate(
            total_pledge=Sum('pledge_amount'),
            bid_count=Count('id')
        )

        # Calculate average for each user across ALL rounds (including rounds they didn't bid in)
        user_averages = []
        for user_data in user_bids:
            total_pledge = float(user_data['total_pledge'])
            # Divide by total number of rounds, not just participated rounds
            average_pledge = total_pledge / total_rounds
            user_averages.append({
                'user_id': user_data['user'],
                'average_pledge': average_pledge,
                'total_pledge': total_pledge,
                'bid_count': user_data['bid_count']
            })

        # Sort by average pledge (highest first)
        user_averages.sort(key=lambda x: x['average_pledge'], reverse=True)

        response_data = {
            'message': f'Round {round_obj.round_number} closed successfully',
            'round_number': round_obj.round_number,
            'auction': {
                'id': str(auction.id),
                'title': auction.title
            }
        }

        # Determine winner if there are bids
        if user_averages:
            winner_data = user_averages[0]
            winner_user = User.objects.get(id=winner_data['user_id'])

            response_data['winner'] = {
                'username': winner_user.username,
                'email': winner_user.email,
                'average_pledge': winner_data['average_pledge'],
                'total_pledge': winner_data['total_pledge'],
                'total_bids': winner_data['bid_count'],
                'total_rounds': total_rounds
            }
            response_data['message'] = f'Round {round_obj.round_number} closed! Current leader: {winner_user.username} with average bid of KSh {winner_data["average_pledge"]:.2f} (Total: KSh {winner_data["total_pledge"]:.2f} across {total_rounds} rounds, participated in {winner_data["bid_count"]} bids)'
        else:
            response_data['winner'] = None
            response_data['message'] = f'Round {round_obj.round_number} closed with no bids'

        return Response(response_data)

    # -------------------- Round Summary --------------------
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def summary(self, request, id=None):
        round_obj = self.get_object()

        participants = Participation.objects.filter(round=round_obj, payment_status='completed')
        total_revenue = participants.aggregate(total=Sum('fee_paid'))['total'] or 0
        valid_bids = round_obj.bids.filter(is_valid=True)
        highest_bid = valid_bids.order_by('-pledge_amount', 'submitted_at').first()

        return Response({
            'round_number': round_obj.round_number,
            'auction': round_obj.auction.title,
            'participants': participants.count(),
            'bids': valid_bids.count(),
            'total_revenue': str(total_revenue),
            'highest_bid': str(highest_bid.pledge_amount) if highest_bid else None,
            'is_open': round_obj.is_open
        })

    # -------------------- Create Next Round --------------------
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def create_next_round(self, request, id=None):
        """Create the next round for this auction"""
        auction = get_object_or_404(Auction, id=id)

        if not request.user.is_superuser:
            return Response({"error": "Only admins can create rounds"}, status=status.HTTP_403_FORBIDDEN)

        # Extract data
        base_price = request.data.get('base_price')
        participation_fee = request.data.get('participation_fee')
        min_pledge = request.data.get('min_pledge')
        max_pledge = request.data.get('max_pledge', None)

        # Required fields check
        if base_price is None or participation_fee is None or min_pledge is None:
            return Response(
                {"error": "base_price, participation_fee, and min_pledge are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Type casting & validation
        try:
            base_price = float(base_price)
            participation_fee = float(participation_fee)
            min_pledge = float(min_pledge)
            max_pledge = float(max_pledge) if max_pledge else None
        except ValueError:
            return Response({"error": "All price fields must be valid numbers"}, status=status.HTTP_400_BAD_REQUEST)

        if base_price <= 0 or participation_fee < 0 or min_pledge <= 0:
            return Response(
                {"error": "base_price, participation_fee, and min_pledge must be positive numbers"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if max_pledge is not None and max_pledge < min_pledge:
            return Response(
                {"error": "max_pledge cannot be less than min_pledge"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Determine next round number
        last_round = auction.rounds.order_by('-round_number').first()
        next_round_number = last_round.round_number + 1 if last_round else 1

        # Use serializer to create round
        serializer = RoundSerializer(data={
            "auction": auction.id,
            "round_number": next_round_number,
            "base_price": base_price,
            "participation_fee": participation_fee,
            "min_pledge": min_pledge,
            "max_pledge": max_pledge
        })

        if serializer.is_valid():
            new_round = serializer.save()
            
            # Auto-close previous active rounds
            auction.rounds.filter(is_active=True).exclude(id=new_round.id).update(is_active=False)
            
            # Broadcast new round via WebSocket
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'auction_{auction.id}',
                {
                    'type': 'round_update',
                    'data': {
                        'round_id': str(new_round.id),
                        'round_number': new_round.round_number,
                        'base_price': str(new_round.base_price),
                        'min_pledge': str(new_round.min_pledge),
                        'max_pledge': str(new_round.max_pledge) if new_round.max_pledge else None,
                        'participation_fee': str(new_round.participation_fee),
                        'is_active': new_round.is_active,
                        'message': f'Round {new_round.round_number} has started!'
                    }
                }
            )
            
            return Response({
                "round_id": str(new_round.id),
                "round_number": new_round.round_number,
                "message": f"Round {new_round.round_number} created successfully"
            }, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HeroBannerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for hero carousel banners
    - List/Retrieve: Public access (returns active banners)
    - Create/Update/Delete: Superuser only
    """
    serializer_class = HeroBannerSerializer

    def get_permissions(self):
        """Public can read, but only superusers can create/update/delete"""
        if self.action in ['list', 'retrieve']:
            return []  # Public access for read operations
        return [IsAdminUser()]  # Superuser required for write operations

    def get_queryset(self):
        """
        Return all banners for superusers (for management),
        only active banners for public (for display)
        """
        if self.request.user and self.request.user.is_superuser:
            return HeroBanner.objects.all().order_by('order', 'created_at')
        return HeroBanner.objects.filter(is_active=True).order_by('order', 'created_at')


class SpecialOfferBannerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for special offer banners
    - List/Retrieve: Public access (returns active banners)
    - Create/Update/Delete: Superuser only
    """
    serializer_class = SpecialOfferBannerSerializer

    def get_permissions(self):
        """Public can read, but only superusers can create/update/delete"""
        if self.action in ['list', 'retrieve']:
            return []  # Public access for read operations
        return [IsAdminUser()]  # Superuser required for write operations

    def get_queryset(self):
        """
        Return all banners for superusers (for management),
        only active banners for public (for display)
        """
        if self.request.user and self.request.user.is_superuser:
            return SpecialOfferBanner.objects.all().order_by('order', 'created_at')
        return SpecialOfferBanner.objects.filter(is_active=True).order_by('order', 'created_at')
