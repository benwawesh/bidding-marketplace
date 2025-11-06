from django.db import models
from django.conf import settings
from auctions.models import Order


class MpesaTransaction(models.Model):
    """Track M-Pesa payment transactions"""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    # User and Order info
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='mpesa_transactions')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='mpesa_transactions', null=True, blank=True)

    # Transaction details
    phone_number = models.CharField(max_length=15)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    account_reference = models.CharField(max_length=100)
    transaction_desc = models.CharField(max_length=255)

    # M-Pesa response data
    merchant_request_id = models.CharField(max_length=100, blank=True, null=True)
    checkout_request_id = models.CharField(max_length=100, blank=True, null=True, unique=True)

    # Callback data (populated when payment is confirmed)
    mpesa_receipt_number = models.CharField(max_length=100, blank=True, null=True)
    transaction_date = models.DateTimeField(null=True, blank=True)
    result_code = models.IntegerField(null=True, blank=True)
    result_desc = models.TextField(blank=True, null=True)

    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Raw callback data (for debugging)
    raw_callback_data = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['checkout_request_id']),
            models.Index(fields=['mpesa_receipt_number']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.amount} - {self.status}"

    def mark_as_completed(self, mpesa_receipt_number, transaction_date):
        """Mark transaction as completed"""
        self.status = 'completed'
        self.mpesa_receipt_number = mpesa_receipt_number
        self.transaction_date = transaction_date
        self.result_code = 0
        self.save()

        # Update associated order
        if self.order:
            self.order.payment_status = 'paid'
            self.order.mpesa_code = mpesa_receipt_number
            self.order.save()

            # Reduce stock and increment units_sold for each item
            for item in self.order.items.all():
                product = item.product
                if product.stock_quantity is not None:
                    if product.stock_quantity >= item.quantity:
                        product.stock_quantity -= item.quantity
                        product.units_sold = (product.units_sold or 0) + item.quantity
                        product.save()
                        print(f"Stock updated for {product.title}: {product.stock_quantity} left, {product.units_sold} sold")

            # Clear the user's cart after successful payment
            from auctions.models import Cart
            try:
                cart = Cart.objects.get(user=self.order.user)
                cart.clear()
                print(f"Cart cleared for user {self.order.user.email} after successful payment")
            except Cart.DoesNotExist:
                pass  # Cart doesn't exist, nothing to clear

    def mark_as_failed(self, result_code, result_desc):
        """Mark transaction as failed"""
        self.status = 'failed'
        self.result_code = result_code
        self.result_desc = result_desc
        self.save()
