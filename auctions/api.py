from django.urls import path
from rest_framework.routers import DefaultRouter
from .viewsets import (
    AuctionViewSet, CategoryViewSet, BidViewSet,
    ParticipationViewSet, PaymentViewSet, CartViewSet,
    OrderViewSet, CustomerViewSet, RoundViewSet, HeroBannerViewSet
)
from .delete_views import delete_product, bulk_delete_products
from .promo_views import get_active_promo_banners
from . import financial_views
from .views import ProductImageViewSet

router = DefaultRouter()
router.register(r'auctions', AuctionViewSet, basename='auction')
router.register(r'rounds', RoundViewSet, basename='round')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'bids', BidViewSet, basename='bid')
router.register(r'participations', ParticipationViewSet, basename='participation')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'product-images', ProductImageViewSet, basename='product-image')
router.register(r'hero-banners', HeroBannerViewSet, basename='hero-banner')

# Add custom URLs BEFORE router.urls
urlpatterns = [
    # Delete endpoints
    path('auctions/bulk-delete/', bulk_delete_products, name='bulk-delete-products'),
    path('auctions/<uuid:product_id>/delete/', delete_product, name='delete-product'),

    # Promo banners
    path('promo-banners/', get_active_promo_banners, name='promo-banners'),

    # Financial Analytics (Admin only)
    path('auctions/analytics/financial/', financial_views.FinancialAnalyticsView.as_view(), name='api-financial-analytics'),
    path('auctions/analytics/transactions/', financial_views.TransactionListView.as_view(), name='api-transaction-list'),
    path('auctions/analytics/transactions/export/', financial_views.ExportTransactionsView.as_view(), name='api-export-transactions'),
]

# Add router URLs
urlpatterns += router.urls
