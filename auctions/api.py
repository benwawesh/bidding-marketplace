from django.urls import path
from rest_framework.routers import DefaultRouter
from .viewsets import (
    AuctionViewSet, CategoryViewSet, BidViewSet, 
    ParticipationViewSet, PaymentViewSet, CartViewSet,
    OrderViewSet, CustomerViewSet
)
from .delete_views import delete_product, bulk_delete_products
from .promo_views import get_active_promo_banners

router = DefaultRouter()
router.register(r'auctions', AuctionViewSet, basename='auction')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'bids', BidViewSet, basename='bid')
router.register(r'participations', ParticipationViewSet, basename='participation')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'customers', CustomerViewSet, basename='customer')

# Add custom URLs BEFORE router.urls
urlpatterns = [
    # Delete endpoints
    path('auctions/bulk-delete/', bulk_delete_products, name='bulk-delete-products'),
    path('auctions/<uuid:product_id>/delete/', delete_product, name='delete-product'),
    
    # Promo banners
    path('promo-banners/', get_active_promo_banners, name='promo-banners'),
]

# Add router URLs
urlpatterns += router.urls
