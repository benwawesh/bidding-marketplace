"""
Financial Analytics Views for Admin Dashboard
Provides comprehensive financial reporting and transaction analysis
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework import status
from django.db.models import Sum, Count, Q, Avg
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from .models import Payment, Participation, Auction, Order
from payments.models import MpesaTransaction


class FinancialAnalyticsView(APIView):
    """
    Comprehensive financial analytics for admin dashboard
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        # Date range filters
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)

        # ============ OVERALL REVENUE METRICS ============

        # Auction Participation Fees
        participation_revenue = Payment.objects.filter(
            payment_type='participation',
            status='completed',
            created_at__gte=start_date
        ).aggregate(
            total=Sum('amount'),
            count=Count('id')
        )

        # Final Pledge Payments (from completed auctions)
        pledge_revenue = Payment.objects.filter(
            payment_type='final_pledge',
            status='completed',
            created_at__gte=start_date
        ).aggregate(
            total=Sum('amount'),
            count=Count('id')
        )

        # Buy Now Orders (from MpesaTransaction)
        order_revenue = MpesaTransaction.objects.filter(
            status='completed',
            created_at__gte=start_date
        ).aggregate(
            total=Sum('amount'),
            count=Count('id')
        )

        # Total Revenue
        total_revenue = (
            (participation_revenue['total'] or Decimal('0')) +
            (pledge_revenue['total'] or Decimal('0')) +
            (order_revenue['total'] or Decimal('0'))
        )

        # ============ TRANSACTION BREAKDOWN ============

        transaction_summary = {
            'participation_fees': {
                'total': float(participation_revenue['total'] or 0),
                'count': participation_revenue['count'],
                'label': 'Auction Participation Fees'
            },
            'final_pledges': {
                'total': float(pledge_revenue['total'] or 0),
                'count': pledge_revenue['count'],
                'label': 'Final Pledge Payments'
            },
            'buy_now_orders': {
                'total': float(order_revenue['total'] or 0),
                'count': order_revenue['count'],
                'label': 'Buy Now Orders'
            },
            'total_revenue': float(total_revenue),
            'total_transactions': (
                participation_revenue['count'] +
                pledge_revenue['count'] +
                order_revenue['count']
            )
        }

        # ============ DAILY REVENUE TREND ============

        # Last 30 days trend
        daily_revenue = Payment.objects.filter(
            status='completed',
            created_at__gte=timezone.now() - timedelta(days=30)
        ).annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            revenue=Sum('amount'),
            transactions=Count('id')
        ).order_by('date')

        # ============ PAYMENT METHOD BREAKDOWN ============

        payment_methods = Payment.objects.filter(
            status='completed',
            created_at__gte=start_date
        ).values('payment_method').annotate(
            total=Sum('amount'),
            count=Count('id')
        )

        # ============ TOP PERFORMING AUCTIONS ============

        top_auctions = Payment.objects.filter(
            payment_type='participation',
            status='completed',
            created_at__gte=start_date
        ).values(
            'auction__id',
            'auction__title'
        ).annotate(
            revenue=Sum('amount'),
            participants=Count('id')
        ).order_by('-revenue')[:10]

        # ============ PENDING & FAILED TRANSACTIONS ============

        pending_payments = Payment.objects.filter(
            status='pending'
        ).aggregate(
            total=Sum('amount'),
            count=Count('id')
        )

        failed_payments = Payment.objects.filter(
            status='failed',
            created_at__gte=start_date
        ).aggregate(
            total=Sum('amount'),
            count=Count('id')
        )

        # ============ MONTHLY GROWTH ============

        monthly_revenue = Payment.objects.filter(
            status='completed',
            created_at__gte=timezone.now() - timedelta(days=365)
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            revenue=Sum('amount'),
            transactions=Count('id')
        ).order_by('month')

        # ============ AVERAGE TRANSACTION VALUE ============

        avg_transaction = Payment.objects.filter(
            status='completed',
            created_at__gte=start_date
        ).aggregate(
            avg=Avg('amount')
        )

        # ============ REFUND METRICS ============

        refunds = Payment.objects.filter(
            status='refunded',
            created_at__gte=start_date
        ).aggregate(
            total=Sum('amount'),
            count=Count('id')
        )

        # Compile response
        return Response({
            'date_range': {
                'days': days,
                'start_date': start_date,
                'end_date': timezone.now()
            },
            'overview': {
                'total_revenue': float(total_revenue),
                'total_transactions': transaction_summary['total_transactions'],
                'average_transaction': float(avg_transaction['avg'] or 0),
                'pending_amount': float(pending_payments['total'] or 0),
                'pending_count': pending_payments['count'],
                'failed_amount': float(failed_payments['total'] or 0),
                'failed_count': failed_payments['count'],
                'refunded_amount': float(refunds['total'] or 0),
                'refunded_count': refunds['count']
            },
            'revenue_breakdown': transaction_summary,
            'daily_trend': list(daily_revenue),
            'monthly_trend': list(monthly_revenue),
            'payment_methods': list(payment_methods),
            'top_auctions': list(top_auctions)
        })


class TransactionListView(APIView):
    """
    Detailed transaction list with filtering and search
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        # Get all payments
        transactions = Payment.objects.select_related('user', 'auction').all()

        # Filters
        status_filter = request.query_params.get('status')
        payment_type = request.query_params.get('payment_type')
        payment_method = request.query_params.get('payment_method')
        search = request.query_params.get('search')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if status_filter:
            transactions = transactions.filter(status=status_filter)

        if payment_type:
            transactions = transactions.filter(payment_type=payment_type)

        if payment_method:
            transactions = transactions.filter(payment_method=payment_method)

        if search:
            transactions = transactions.filter(
                Q(transaction_id__icontains=search) |
                Q(user__username__icontains=search) |
                Q(auction__title__icontains=search)
            )

        if start_date:
            transactions = transactions.filter(created_at__gte=start_date)

        if end_date:
            transactions = transactions.filter(created_at__lte=end_date)

        # Order by most recent
        transactions = transactions.order_by('-created_at')

        # Paginate (limit to 100 per page)
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 50))
        start = (page - 1) * page_size
        end = start + page_size

        total_count = transactions.count()
        transactions_page = transactions[start:end]

        # Serialize
        data = [{
            'id': str(t.id),
            'transaction_id': t.transaction_id,
            'user': {
                'id': t.user.id,
                'username': t.user.username,
                'email': t.user.email
            },
            'auction': {
                'id': str(t.auction.id),
                'title': t.auction.title
            } if t.auction else None,
            'amount': float(t.amount),
            'payment_type': t.payment_type,
            'payment_method': t.payment_method,
            'status': t.status,
            'created_at': t.created_at,
            'updated_at': t.updated_at
        } for t in transactions_page]

        return Response({
            'count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size,
            'results': data
        })


class ExportTransactionsView(APIView):
    """
    Export transactions to CSV
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        import csv
        from django.http import HttpResponse

        # Apply same filters as TransactionListView
        transactions = Payment.objects.select_related('user', 'auction').all()

        status_filter = request.query_params.get('status')
        if status_filter:
            transactions = transactions.filter(status=status_filter)

        transactions = transactions.order_by('-created_at')

        # Create CSV
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="transactions.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Transaction ID', 'Date', 'User', 'Email', 'Auction',
            'Amount', 'Type', 'Method', 'Status'
        ])

        for t in transactions:
            writer.writerow([
                t.transaction_id,
                t.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                t.user.username,
                t.user.email,
                t.auction.title if t.auction else 'N/A',
                float(t.amount),
                t.payment_type,
                t.payment_method,
                t.status
            ])

        return response
