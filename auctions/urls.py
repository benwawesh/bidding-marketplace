from django.urls import path
from . import views
from . import financial_views

urlpatterns = [
    # Public pages
    path('', views.HomeView.as_view(), name='home'),
    path('browse/', views.BrowseAuctionsView.as_view(), name='browse'),
    path('auction/<uuid:auction_id>/', views.AuctionDetailView.as_view(), name='auction_detail'),
    path('category/<uuid:category_id>/', views.CategoryView.as_view(), name='category'),

    # Shopping cart
    path('cart/', views.CartView.as_view(), name='cart'),

    # Checkout & Orders (NEW)
    path('checkout/', views.CheckoutView.as_view(), name='checkout'),
    path('orders/<uuid:order_id>/confirmation/', views.OrderConfirmationView.as_view(), name='order_confirmation'),
    path('orders/history/', views.OrderHistoryView.as_view(), name='order_history'),

    # Financial Analytics (Admin only)
    path('analytics/financial/', financial_views.FinancialAnalyticsView.as_view(), name='financial-analytics'),
    path('analytics/transactions/', financial_views.TransactionListView.as_view(), name='transaction-list'),
    path('analytics/transactions/export/', financial_views.ExportTransactionsView.as_view(), name='export-transactions'),
]
# Delete endpoints
from .delete_views import delete_product, bulk_delete_products

urlpatterns += [
    path('auctions/<uuid:product_id>/delete/', delete_product, name='delete-product'),
    path('auctions/bulk-delete/', bulk_delete_products, name='bulk-delete-products'),
]
