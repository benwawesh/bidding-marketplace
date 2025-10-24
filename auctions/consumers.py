import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Auction, Bid, Round

User = get_user_model()


class AuctionConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time auction updates
    """

    async def connect(self):
        """Called when WebSocket connection is established"""
        print("=" * 60)
        print("🔌 WEBSOCKET CONNECT CALLED")
        
        try:
            self.auction_id = self.scope['url_route']['kwargs']['auction_id']
            print(f"✅ Auction ID: {self.auction_id}")
            
            self.room_group_name = f'auction_{self.auction_id}'
            print(f"✅ Room group: {self.room_group_name}")
            
            # Get user
            user = self.scope.get('user')
            print(f"✅ User: {user}")
            print(f"✅ Is authenticated: {user.is_authenticated if user else False}")
            
            self.user_id = user.id if user and user.is_authenticated else None
            print(f"✅ User ID: {self.user_id}")

            # Join room group
            print("📝 Joining room group...")
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            print("✅ Joined room group")

            # Accept connection
            print("📝 Accepting connection...")
            await self.accept()
            print("✅ Connection accepted")

            # Send initial data
            print("📝 Fetching initial leaderboard...")
            try:
                leaderboard_data = await self.get_leaderboard()
                print(f"✅ Leaderboard data: {len(leaderboard_data.get('top_bids', []))} bids")
                
                print("📝 Sending leaderboard...")
                await self.send(text_data=json.dumps({
                    'type': 'leaderboard_update',
                    'data': leaderboard_data
                }))
                print("✅ Leaderboard sent successfully")
                
            except Exception as e:
                print(f"⚠️  Error getting/sending leaderboard: {e}")
                import traceback
                traceback.print_exc()
                
                # Send empty data
                await self.send(text_data=json.dumps({
                    'type': 'leaderboard_update',
                    'data': {
                        'top_bids': [],
                        'total_participants': 0,
                        'highest_amount': '0'
                    }
                }))
            
            print("✅ CONNECT COMPLETED SUCCESSFULLY")
            print("=" * 60)
            
        except Exception as e:
            print(f"❌ FATAL ERROR IN CONNECT: {e}")
            import traceback
            traceback.print_exc()
            print("=" * 60)
            await self.close()

    async def disconnect(self, close_code):
        """Called when WebSocket connection is closed"""
        print(f"🔌 DISCONNECT CALLED - Code: {close_code}")
        try:
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            print("✅ Left room group")
        except Exception as e:
            print(f"Error in disconnect: {e}")

    async def receive(self, text_data):
        """Called when we receive a message from WebSocket"""
        print(f"📨 RECEIVED MESSAGE: {text_data[:100]}")
        try:
            data = json.loads(text_data)
            message_type = data.get('type')

            if message_type == 'request_leaderboard':
                leaderboard_data = await self.get_leaderboard()
                await self.send(text_data=json.dumps({
                    'type': 'leaderboard_update',
                    'data': leaderboard_data
                }))
        except Exception as e:
            print(f"Error in receive: {e}")

    async def leaderboard_update(self, event):
        """Send leaderboard update to WebSocket"""
        print("📤 SENDING LEADERBOARD UPDATE")
        try:
            await self.send(text_data=json.dumps({
                'type': 'leaderboard_update',
                'data': event['data']
            }))
            print("✅ Leaderboard update sent")
        except Exception as e:
            print(f"Error sending leaderboard_update: {e}")

    async def round_update(self, event):
        """Handle round update broadcast"""
        print("📤 SENDING ROUND UPDATE")
        try:
            await self.send(text_data=json.dumps({
                'type': 'round_update',
                'data': event['data']
            }))
            print("✅ Round update sent")
        except Exception as e:
            print(f"Error sending round_update: {e}")

    @database_sync_to_async
    def get_leaderboard(self):
        """Fetch current leaderboard data"""
        print(f"🔍 Getting leaderboard for auction: {self.auction_id}")
        
        try:
            auction = Auction.objects.get(id=self.auction_id)
            print(f"✅ Found auction: {auction.title}")
            
            # Get current round
            current_round = auction.rounds.filter(is_active=True).first()
            
            if not current_round:
                print("⚠️  No active round found")
                return {
                    'top_bids': [],
                    'total_participants': 0,
                    'highest_amount': '0',
                    'round_number': 0,
                    'round_base_price': '0'
                }
            
            print(f"✅ Found round: {current_round.round_number}")

            # Get bids
            all_bids = current_round.bids.filter(
                is_valid=True
            ).select_related('user').order_by(
                '-pledge_amount',
                'submitted_at'
            )
            
            print(f"✅ Found {all_bids.count()} bids")

            # Serialize top 10
            top_bids = all_bids[:10]
            serialized_bids = []

            for index, bid in enumerate(top_bids, start=1):
                serialized_bids.append({
                    'id': str(bid.id),
                    'position': index,
                    'is_current_user': bid.user.id == self.user_id if self.user_id else False,
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

            result = {
                'top_bids': serialized_bids,
                'total_participants': all_bids.count(),
                'highest_amount': str(highest_amount),
                'round_number': current_round.round_number,
                'round_base_price': str(current_round.base_price),
            }
            
            print(f"✅ Leaderboard data prepared")
            return result

        except Auction.DoesNotExist:
            print(f"❌ Auction {self.auction_id} not found")
            return {
                'top_bids': [],
                'total_participants': 0,
                'highest_amount': '0'
            }
        except Exception as e:
            print(f"❌ Error in get_leaderboard: {e}")
            import traceback
            traceback.print_exc()
            return {
                'top_bids': [],
                'total_participants': 0,
                'highest_amount': '0'
            }
