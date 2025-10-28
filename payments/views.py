from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import transaction
import json

from auctions.models import Auction, Participation, Payment, Round
from .mpesa import MpesaAPI


class InitiatePaymentView(APIView):
    """Initiate M-Pesa STK Push for participation fee"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        auction_id = request.data.get('auction_id')
        phone_number = request.data.get('phone_number')

        if not auction_id or not phone_number:
            return Response(
                {'error': 'auction_id and phone_number are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            auction = get_object_or_404(Auction, id=auction_id)

            if auction.status != 'active':
                return Response(
                    {'error': 'Auction is not active'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            current_round = auction.get_current_round()
            if not current_round:
                return Response(
                    {'error': 'No active round for this auction'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            existing_participation = Participation.objects.filter(
                user=request.user,
                auction=auction,
                round=current_round,
                payment_status='completed'
            ).first()

            if existing_participation:
                return Response(
                    {'error': 'You have already paid for this round'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            mpesa = MpesaAPI()
            try:
                formatted_phone = mpesa.format_phone_number(phone_number)
            except ValueError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )

            payment = Payment.objects.create(
                user=request.user,
                auction=auction,
                payment_type='participation',
                amount=current_round.participation_fee,
                method='mpesa',
                status='pending'
            )

            participation = Participation.objects.create(
                user=request.user,
                auction=auction,
                round=current_round,
                fee_paid=current_round.participation_fee,
                payment_status='pending'
            )

            account_ref = f"AUC-{auction.id}"
            transaction_desc = f"Participation fee for {auction.title}"

            result = mpesa.initiate_stk_push(
                phone_number=formatted_phone,
                amount=current_round.participation_fee,
                account_reference=account_ref,
                transaction_desc=transaction_desc
            )

            if result.get('success'):
                payment.transaction_id = result.get('checkout_request_id')
                payment.save()

                return Response({
                    'success': True,
                    'message': 'STK Push sent. Check your phone to complete payment.',
                    'checkout_request_id': result.get('checkout_request_id'),
                    'payment_id': str(payment.id)
                })
            else:
                payment.delete()
                participation.delete()

                return Response(
                    {'error': result.get('message')},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            return Response(
                {'error': f'Error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class MpesaCallbackView(APIView):
    """Handle M-Pesa payment callbacks"""
    permission_classes = []

    def post(self, request):
        try:
            callback_data = request.data

            print("M-Pesa Callback:", json.dumps(callback_data, indent=2))

            result_code = callback_data.get('Body', {}).get('stkCallback', {}).get('ResultCode')
            result_desc = callback_data.get('Body', {}).get('stkCallback', {}).get('ResultDesc')
            checkout_request_id = callback_data.get('Body', {}).get('stkCallback', {}).get('CheckoutRequestID')

            if not checkout_request_id:
                return Response({'ResultCode': 0, 'ResultDesc': 'Invalid callback'})

            try:
                payment = Payment.objects.get(transaction_id=checkout_request_id)
            except Payment.DoesNotExist:
                print(f"Payment not found for CheckoutRequestID: {checkout_request_id}")
                return Response({'ResultCode': 0, 'ResultDesc': 'Payment not found'})

            if result_code == 0:
                callback_metadata = callback_data.get('Body', {}).get('stkCallback', {}).get('CallbackMetadata',
                                                                                             {}).get('Item', [])

                mpesa_receipt = None
                for item in callback_metadata:
                    if item.get('Name') == 'MpesaReceiptNumber':
                        mpesa_receipt = item.get('Value')

                with transaction.atomic():
                    payment.status = 'completed'
                    payment.transaction_id = mpesa_receipt or checkout_request_id
                    payment.save()

                    participation = Participation.objects.filter(
                        user=payment.user,
                        auction=payment.auction,
                        payment_status='pending'
                    ).first()

                    if participation:
                        participation.payment_status = 'completed'
                        participation.paid_at = payment.created_at
                        participation.save()

                print(f"Payment successful: {mpesa_receipt}")

            else:
                with transaction.atomic():
                    payment.status = 'failed'
                    payment.save()

                    participation = Participation.objects.filter(
                        user=payment.user,
                        auction=payment.auction,
                        payment_status='pending'
                    ).first()

                    if participation:
                        participation.payment_status = 'failed'
                        participation.save()

                print(f"Payment failed: {result_desc}")

            return Response({'ResultCode': 0, 'ResultDesc': 'Accepted'})

        except Exception as e:
            print(f"Callback error: {str(e)}")
            return Response({'ResultCode': 1, 'ResultDesc': 'Error processing callback'})


class MockPaymentView(APIView):
    """
    Mock payment for testing - instantly completes payment
    USE ONLY IN DEVELOPMENT
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        auction_id = request.data.get('auction_id')

        if not auction_id:
            return Response(
                {'error': 'auction_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            auction = get_object_or_404(Auction, id=auction_id)

            if auction.status != 'active':
                return Response(
                    {'error': 'Auction is not active'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            current_round = auction.get_current_round()
            if not current_round:
                return Response(
                    {'error': 'No active round for this auction'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if already paid
            existing_participation = Participation.objects.filter(
                user=request.user,
                auction=auction,
                round=current_round,
                payment_status='completed'
            ).first()

            if existing_participation:
                return Response(
                    {'error': 'You have already paid for this round'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic():
                # Create completed payment
                payment = Payment.objects.create(
                    user=request.user,
                    auction=auction,
                    payment_type='participation',
                    amount=current_round.participation_fee,
                    method='mock',
                    status='completed',
                    transaction_id=f'MOCK-{auction.id}-{request.user.id}'
                )

                # Create completed participation
                participation = Participation.objects.create(
                    user=request.user,
                    auction=auction,
                    round=current_round,
                    fee_paid=current_round.participation_fee,
                    payment_status='completed'
                )

            return Response({
                'success': True,
                'message': 'Mock payment completed successfully',
                'payment_id': str(payment.id)
            })

        except Exception as e:
            return Response(
                {'error': f'Error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MockOrderPaymentView(APIView):
    """
    Mock payment for orders - instantly completes payment
    USE ONLY IN DEVELOPMENT
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from auctions.models import Order  # Import Order model

        order_id = request.data.get('order_id')

        if not order_id:
            return Response(
                {'error': 'order_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            order = get_object_or_404(Order, id=order_id, user=request.user)

            # Check if already paid
            if order.payment_status == 'completed':
                return Response(
                    {'error': 'Order already paid'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic():
                # Update order payment status
                order.payment_status = 'completed'
                order.status = 'paid'
                order.paid_at = timezone.now()
                order.mpesa_transaction_id = f'MOCK-ORDER-{order.order_number}'
                order.save()

                # Reduce stock for each item
                for item in order.items.all():
                    product = item.product
                    if product.stock_quantity is not None:
                        if product.stock_quantity >= item.quantity:
                            product.stock_quantity -= item.quantity
                            product.units_sold = (product.units_sold or 0) + item.quantity
                            product.save()

            return Response({
                'success': True,
                'message': 'Payment successful',
                'order_id': str(order.id),
                'order_number': order.order_number,
                'transaction_id': order.mpesa_transaction_id
            })

        except Exception as e:
            return Response(
                {'error': f'Error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CheckPaymentStatusView(APIView):
    """Check if user has paid for current auction round"""
    permission_classes = [IsAuthenticated]

    def get(self, request, auction_id):
        try:
            auction = get_object_or_404(Auction, id=auction_id)
            current_round = auction.get_current_round()

            if not current_round:
                return Response({'has_paid': False, 'message': 'No active round'})

            participation = Participation.objects.filter(
                user=request.user,
                auction=auction,
                round=current_round,
                payment_status='completed'
            ).first()

            if participation:
                return Response({
                    'has_paid': True,
                    'participation_fee': float(current_round.participation_fee),
                    'paid_at': participation.paid_at
                })

            pending_participation = Participation.objects.filter(
                user=request.user,
                auction=auction,
                round=current_round,
                payment_status='pending'
            ).first()

            if pending_participation:
                # Find the pending payment
                pending_payment = Payment.objects.filter(
                    user=request.user,
                    auction=auction,
                    status='pending'
                ).first()

                if pending_payment and pending_payment.transaction_id:
                    # Query M-Pesa for the payment status
                    mpesa = MpesaAPI()
                    query_result = mpesa.query_stk_push_status(pending_payment.transaction_id)

                    if query_result.get('status') == 'completed':
                        # Update payment and participation to completed
                        with transaction.atomic():
                            pending_payment.status = 'completed'
                            pending_payment.save()

                            pending_participation.payment_status = 'completed'
                            pending_participation.paid_at = timezone.now()
                            pending_participation.save()

                        return Response({
                            'has_paid': True,
                            'participation_fee': float(current_round.participation_fee),
                            'paid_at': pending_participation.paid_at
                        })
                    elif query_result.get('status') in ['cancelled', 'timeout', 'failed']:
                        # Update payment and participation to failed
                        with transaction.atomic():
                            pending_payment.status = 'failed'
                            pending_payment.save()

                            pending_participation.payment_status = 'failed'
                            pending_participation.save()

                        return Response({
                            'has_paid': False,
                            'status': query_result.get('status'),
                            'message': query_result.get('message')
                        })

                return Response({
                    'has_paid': False,
                    'status': 'pending',
                    'message': 'Payment pending. Complete M-Pesa prompt on your phone.'
                })

            return Response({
                'has_paid': False,
                'participation_fee': float(current_round.participation_fee),
                'message': 'Payment required to participate'
            })

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

