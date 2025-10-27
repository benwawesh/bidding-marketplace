# Add this to the end of ParticipationViewSet in viewsets.py

    @action(detail=False, methods=['get'])
    def my_participations(self, request):
        """Get current user's participations"""
        participations = Participation.objects.filter(user=request.user)
        serializer = ParticipationSerializer(participations, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """Create participation record (entry fee payment) - UPDATED for frontend"""
        auction_id = request.data.get('auction')
        round_id = request.data.get('round')
        fee_paid = request.data.get('fee_paid')
        payment_status = request.data.get('payment_status', 'completed')
        paid_at = request.data.get('paid_at')

        if not all([auction_id, round_id, fee_paid]):
            return Response(
                {'error': 'auction, round, and fee_paid are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            auction = Auction.objects.get(id=auction_id)
            round_obj = Round.objects.get(id=round_id, auction=auction)

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
