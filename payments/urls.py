from django.urls import path
from .views import InitiatePaymentView, MpesaCallbackView, CheckPaymentStatusView, MockPaymentView, MockOrderPaymentView

app_name = 'payments'

urlpatterns = [
    path('initiate/', InitiatePaymentView.as_view(), name='initiate_payment'),
    path('callback/', MpesaCallbackView.as_view(), name='mpesa_callback'),
    path('status/<uuid:auction_id>/', CheckPaymentStatusView.as_view(), name='payment_status'),
    path('mock/', MockPaymentView.as_view(), name='mock_payment'),
    path('mock-order/', MockOrderPaymentView.as_view(), name='mock_order_payment'),

]