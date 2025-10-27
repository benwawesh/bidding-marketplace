from django.contrib import admin
from .models import MpesaTransaction


@admin.register(MpesaTransaction)
class MpesaTransactionAdmin(admin.ModelAdmin):
    list_display = ['user', 'phone_number', 'amount', 'status', 'mpesa_receipt_number', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user__username', 'phone_number', 'mpesa_receipt_number', 'checkout_request_id']
    readonly_fields = ['created_at', 'updated_at', 'raw_callback_data']

    fieldsets = (
        ('User Information', {
            'fields': ('user', 'order')
        }),
        ('Transaction Details', {
            'fields': ('phone_number', 'amount', 'account_reference', 'transaction_desc')
        }),
        ('M-Pesa Request Data', {
            'fields': ('merchant_request_id', 'checkout_request_id')
        }),
        ('M-Pesa Response Data', {
            'fields': ('mpesa_receipt_number', 'transaction_date', 'result_code', 'result_desc')
        }),
        ('Status', {
            'fields': ('status', 'created_at', 'updated_at')
        }),
        ('Raw Data', {
            'fields': ('raw_callback_data',),
            'classes': ('collapse',)
        }),
    )
