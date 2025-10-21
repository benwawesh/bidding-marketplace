import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Auction, Bid, Round
from .serializers import BidSerializer

User = get_user_model()


class AuctionConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time auction updates
    Handles: leaderboard updates, new bids, user position changes
    """

    async def connect(self):
        """Called when WebSocket connection is established"""
        try:
            self.auction_id = self.scope['url_route']['kwargs']['auction_id']
            self.room_group_name = f'auction_{self.auction_id}'
            
            # Get user ID from scope (if authenticated)
            self.user_id = self.scope.get('user').id if self.scope.get('user') and self.scope['user'].is_authenticated else None

            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )

            await self.accept()

            # Send initial leaderboard data
            try:
                leaderboard_data = await self.get_leaderboard()
                await self.send(text_data=json.dumps({
                    'type': 'leaderboard_update',
                    'data': leaderboard_data
                }))
            except Exception:
                # Send empty leaderboard instead of failing
                await self.send(text_data=json.dumps({
                    'type': 'leaderboard_update',
                    'data': {
                        'top_bids': [],
                        'total_participants': 0,
                        'highest_amount': '0'
                    }
                }))
        except Exception:
            await self.close()

    async def disconnect(self, close_code):
        """Called when WebSocket connection is closed"""
        try:
            # Leave room group
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
        except Exception:
            pass

    async def receive(self, text_data):
        """Called when we receive a message from WebSocket"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')

            if message_type == 'request_leaderboard':
                # Client requesting leaderboard update
                leaderboard_data = await self.get_leaderboard()
                await self.send(text_data=json.dumps({
                    'type': 'leaderboard_update',
                    'data': leaderboard_data
                }))
        except Exception:
            pass

    async def leaderboard_update(self, event):
        """Send leaderboard update to WebSocket"""
        try:
            await self.send(text_data=json.dumps({
                'type': 'leaderboard_update',
                'data': event['data']
            }))
        except Exception:
            pass

    async def new_bid(self, event):
        """Send new bid notification to WebSocket"""
        try:
            await self.send(text_data=json.dumps({
                'type': 'new_bid',
                'data': event['data']
            }))
        except Exception:
            pass

    @database_sync_to_async
    def get_leaderboard(self):
        """Fetch current leaderboard data with position and is_current_user fields"""
        try:
            auction = Auction.objects.get(id=self.auction_id)
            
            # Check if auction has any rounds
            try:
                current_round = auction.get_current_round()
            except AttributeError:
                # get_current_round method doesn't exist, get latest round
                current_round = auction.rounds.filter(is_active=True).first()
            
            if not current_round:
                return {
                    'top_bids': [],
                    'total_participants': 0,
                    'highest_amount': '0',
                    'round_number': 0,
                    'round_base_price': '0'
                }

            # Get all valid bids, ordered by amount and time
            all_bids = current_round.bids.filter(
                is_valid=True
            ).select_related('user').order_by(
                '-pledge_amount',
                'submitted_at'  # Earlier bids rank higher in ties
            )

            # Get top bids
            top_bids = all_bids[:10]
            serialized_bids = []

            for index, bid in enumerate(top_bids, start=1):
                serialized_bids.append({
                    'id': str(bid.id),
                    'position': index,  # ✅ ADDED
                    'is_current_user': bid.user.id == self.user_id if self.user_id else False,  # ✅ ADDED
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

            # Count tied at top
            tied_at_top = all_bids.filter(
                pledge_amount=highest_amount
            ).count() if highest_amount > 0 else 0

            # Check if current user is in top 10
            user_in_top_10 = False
            user_position = None
            user_bid = None
            
            if self.user_id:
                user_bid_obj = all_bids.filter(user_id=self.user_id).first()
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
                'user_position': user_position,
                'user_bid': user_bid,
                'user_in_top_10': user_in_top_10,
            }

        except Auction.DoesNotExist:
            return {
                'error': 'Auction not found',
                'top_bids': [],
                'total_participants': 0,
                'highest_amount': '0'
            }
        except Exception:
            return {
                'top_bids': [],
                'total_participants': 0,
                'highest_amount': '0'
            }
