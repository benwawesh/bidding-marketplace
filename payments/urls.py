from django.urls import path
from .views import InitiatePaymentView, MpesaCallbackView, CheckPaymentStatusView, MockPaymentView, MockOrderPaymentView
from .mpesa_views import InitiateOrderPaymentView, MpesaOrderCallbackView, CheckOrderPaymentStatusView, MyTransactionsView

app_name = 'payments'

urlpatterns = [
    # Auction participation payments
    path('initiate/', InitiatePaymentView.as_view(), name='initiate_payment'),
    path('callback/', MpesaCallbackView.as_view(), name='mpesa_callback'),
    path('status/<uuid:auction_id>/', CheckPaymentStatusView.as_view(), name='payment_status'),
    path('mock/', MockPaymentView.as_view(), name='mock_payment'),
    path('mock-order/', MockOrderPaymentView.as_view(), name='mock_order_payment'),

    # Order payments (M-Pesa)
    path('mpesa/initiate-order/', InitiateOrderPaymentView.as_view(), name='initiate_order_payment'),
    path('mpesa/callback/', MpesaOrderCallbackView.as_view(), name='mpesa_order_callback'),
    path('mpesa/order-status/<uuid:order_id>/', CheckOrderPaymentStatusView.as_view(), name='order_payment_status'),
    path('mpesa/my-transactions/', MyTransactionsView.as_view(), name='my_transactions'),
]