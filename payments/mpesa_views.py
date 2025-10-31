"""
M-Pesa Payment Views for Order Checkout
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import transaction
from django.utils import timezone
from datetime import datetime
import json

from auctions.models import Order
from .models import MpesaTransaction
from .mpesa import MpesaAPI


class InitiateOrderPaymentView(APIView):
    """Initiate M-Pesa STK Push for order payment"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('order_id')
        phone_number = request.data.get('phone_number')

        if not order_id or not phone_number:
            return Response(
                {'error': 'order_id and phone_number are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Get the order
            order = get_object_or_404(Order, id=order_id, user=request.user)

            # Check if order is already paid
            if order.payment_status == 'paid':
                return Response(
                    {'error': 'Order is already paid'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if there's already a pending transaction
            existing_transaction = MpesaTransaction.objects.filter(
                order=order,
                status='pending'
            ).first()

            if existing_transaction:
                return Response(
                    {
                        'error': 'Payment already in progress',
                        'checkout_request_id': existing_transaction.checkout_request_id
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Initialize M-Pesa API
            mpesa = MpesaAPI()

            # Format phone number
            try:
                formatted_phone = mpesa.format_phone_number(phone_number)
            except ValueError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Prepare transaction details
            account_ref = f"ORDER-{order.order_number}"
            transaction_desc = f"Payment for order {order.order_number}"
            amount = int(order.total_price)  # M-Pesa requires integer amount

            # Initiate STK Push
            result = mpesa.initiate_stk_push(
                phone_number=formatted_phone,
                amount=amount,
                account_reference=account_ref,
                transaction_desc=transaction_desc
            )

            if result.get('success'):
                # Create transaction record
                mpesa_transaction = MpesaTransaction.objects.create(
                    user=request.user,
                    order=order,
                    phone_number=formatted_phone,
                    amount=order.total_price,
                    account_reference=account_ref,
                    transaction_desc=transaction_desc,
                    merchant_request_id=result.get('merchant_request_id'),
                    checkout_request_id=result.get('checkout_request_id'),
                    status='pending'
                )

                return Response({
                    'success': True,
                    'message': result.get('message', 'STK Push sent. Check your phone to complete payment.'),
                    'checkout_request_id': result.get('checkout_request_id'),
                    'transaction_id': str(mpesa_transaction.id)
                })
            else:
                return Response(
                    {'error': result.get('message', 'Failed to initiate payment')},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            return Response(
                {'error': f'Error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class MpesaOrderCallbackView(APIView):
    """Handle M-Pesa payment callbacks for orders"""
    permission_classes = []  # No authentication required for callback

    def post(self, request):
        try:
            callback_data = request.data

            # Log callback for debugging
            print("=" * 80)
            print("M-Pesa Order Callback Received:")
            print(json.dumps(callback_data, indent=2))
            print("=" * 80)

            # Extract callback data
            stk_callback = callback_data.get('Body', {}).get('stkCallback', {})
            result_code = stk_callback.get('ResultCode')
            result_desc = stk_callback.get('ResultDesc')
            checkout_request_id = stk_callback.get('CheckoutRequestID')

            if not checkout_request_id:
                print("ERROR: No CheckoutRequestID in callback")
                return Response({'ResultCode': 1, 'ResultDesc': 'Invalid callback data'})

            # Find the transaction - try both MpesaTransaction (orders) and Payment (auctions)
            mpesa_transaction = None
            auction_payment = None

            try:
                mpesa_transaction = MpesaTransaction.objects.get(
                    checkout_request_id=checkout_request_id
                )
                print(f"Found order transaction for CheckoutRequestID: {checkout_request_id}")
            except MpesaTransaction.DoesNotExist:
                # Try to find auction payment
                try:
                    from auctions.models import Payment, Participation
                    auction_payment = Payment.objects.get(transaction_id=checkout_request_id)
                    print(f"Found auction payment for CheckoutRequestID: {checkout_request_id}")
                except Payment.DoesNotExist:
                    print(f"ERROR: No transaction found for CheckoutRequestID: {checkout_request_id}")
                    return Response({'ResultCode': 0, 'ResultDesc': 'Transaction not found'})

            # Handle auction payment callback
            if auction_payment:
                if result_code == 0:
                    # Payment successful for auction
                    callback_metadata = stk_callback.get('CallbackMetadata', {}).get('Item', [])
                    mpesa_receipt = None
                    for item in callback_metadata:
                        if item.get('Name') == 'MpesaReceiptNumber':
                            mpesa_receipt = item.get('Value')

                    with transaction.atomic():
                        auction_payment.status = 'completed'
                        auction_payment.transaction_id = mpesa_receipt or checkout_request_id
                        auction_payment.save()

                        # Update participation
                        participation = Participation.objects.filter(
                            user=auction_payment.user,
                            auction=auction_payment.auction,
                            payment_status='pending'
                        ).first()

                        if participation:
                            participation.payment_status = 'completed'
                            participation.paid_at = auction_payment.created_at
                            participation.save()

                        print(f"Auction payment successful: {mpesa_receipt}")
                else:
                    auction_payment.status = 'failed'
                    auction_payment.save()
                    print(f"Auction payment failed: {result_desc}")

                return Response({'ResultCode': 0, 'ResultDesc': 'Accepted'})

            # Handle order payment callback (original code)
            # Save raw callback data
            mpesa_transaction.raw_callback_data = callback_data
            mpesa_transaction.result_code = result_code
            mpesa_transaction.result_desc = result_desc
            mpesa_transaction.save()

            # Check if payment was successful
            if result_code == 0:
                # Payment successful - extract metadata
                callback_metadata = stk_callback.get('CallbackMetadata', {}).get('Item', [])

                mpesa_receipt = None
                transaction_date = None
                phone_number = None

                for item in callback_metadata:
                    name = item.get('Name')
                    value = item.get('Value')

                    if name == 'MpesaReceiptNumber':
                        mpesa_receipt = value
                    elif name == 'TransactionDate':
                        # Convert 20230929153045 to datetime
                        transaction_date = datetime.strptime(str(value), '%Y%m%d%H%M%S')
                    elif name == 'PhoneNumber':
                        phone_number = value

                print(f"Payment Successful:")
                print(f"  Receipt: {mpesa_receipt}")
                print(f"  Date: {transaction_date}")
                print(f"  Phone: {phone_number}")

                # Update transaction and order in atomic transaction
                with transaction.atomic():
                    # Mark transaction as completed
                    mpesa_transaction.mark_as_completed(
                        mpesa_receipt_number=mpesa_receipt,
                        transaction_date=transaction_date or timezone.now()
                    )

                    print(f"Order {mpesa_transaction.order.order_number} marked as paid")

            else:
                # Payment failed
                print(f"Payment Failed: {result_desc}")

                with transaction.atomic():
                    mpesa_transaction.mark_as_failed(
                        result_code=result_code,
                        result_desc=result_desc
                    )

                    # Optionally update order status
                    if mpesa_transaction.order:
                        mpesa_transaction.order.payment_status = 'failed'
                        mpesa_transaction.order.save()

                print(f"Order {mpesa_transaction.order.order_number} payment failed")

            # Acknowledge callback
            return Response({'ResultCode': 0, 'ResultDesc': 'Accepted'})

        except Exception as e:
            print(f"ERROR in M-Pesa Callback: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'ResultCode': 1, 'ResultDesc': f'Error: {str(e)}'})


class CheckOrderPaymentStatusView(APIView):
    """Check payment status for an order"""
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        try:
            order = get_object_or_404(Order, id=order_id, user=request.user)

            # Get latest transaction for this order
            latest_transaction = MpesaTransaction.objects.filter(
                order=order
            ).order_by('-created_at').first()

            if not latest_transaction:
                return Response({
                    'payment_status': 'unpaid',
                    'order_status': order.status,
                    'total_price': float(order.total_price),
                    'message': 'No payment initiated'
                })

            return Response({
                'payment_status': latest_transaction.status,
                'order_status': order.status,
                'total_price': float(order.total_price),
                'mpesa_receipt': latest_transaction.mpesa_receipt_number,
                'transaction_date': latest_transaction.transaction_date,
                'result_desc': latest_transaction.result_desc,
                'message': self._get_status_message(latest_transaction.status)
            })

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _get_status_message(self, payment_status):
        """Get user-friendly message for payment status"""
        messages = {
            'pending': 'Payment in progress. Please complete the prompt on your phone.',
            'completed': 'Payment completed successfully!',
            'failed': 'Payment failed. Please try again.',
            'cancelled': 'Payment was cancelled.'
        }
        return messages.get(payment_status, 'Unknown status')


class MyTransactionsView(APIView):
    """Get user's M-Pesa transactions"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            transactions = MpesaTransaction.objects.filter(
                user=request.user
            ).order_by('-created_at')[:20]  # Last 20 transactions

            transaction_list = []
            for txn in transactions:
                transaction_list.append({
                    'id': str(txn.id),
                    'order_number': txn.order.order_number if txn.order else None,
                    'amount': float(txn.amount),
                    'phone_number': txn.phone_number,
                    'status': txn.status,
                    'mpesa_receipt': txn.mpesa_receipt_number,
                    'transaction_date': txn.transaction_date,
                    'created_at': txn.created_at,
                    'result_desc': txn.result_desc
                })

            return Response({
                'transactions': transaction_list,
                'count': len(transaction_list)
            })

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
