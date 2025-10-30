"""
BidMarket URL Configuration
Complete routing with M-Pesa payment integration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from admin_panel.api_views import PromoBarSettingsAPIView

urlpatterns = [
    path('secret-admin/', admin.site.urls),
    path('', include('auctions.urls')),
    path('accounts/', include('accounts.urls')),
    path('admin-panel/', include('admin_panel.urls')),
    path('api/settings/promobar/', PromoBarSettingsAPIView.as_view(), name='promobar-settings'),  # PromoBar settings API
    path('api/payments/', include('payments.urls')),  # Must be BEFORE api/
    path('api/', include('auctions.api')),  # This catches everything else
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

"""
API Endpoints Available:

Authentication:
- POST   /api/auth/token/              - Get JWT tokens
- POST   /api/auth/token/refresh/      - Refresh token
- GET    /api/auth/users/me/           - Get current user

Auctions:
- GET    /api/auctions/                - List auctions
- POST   /api/auctions/                - Create auction (seller only)
- GET    /api/auctions/{uuid}/         - Auction detail
- POST   /api/auctions/{uuid}/activate/ - Activate auction
- POST   /api/auctions/{uuid}/close/   - Close auction
- GET    /api/auctions/{uuid}/bids/    - Get bids
- GET    /api/auctions/{uuid}/leaderboard/ - Top 10 bids

Categories:
- GET    /api/categories/              - List categories
- POST   /api/categories/              - Create category

Bids:
- GET    /api/bids/                    - My bids
- POST   /api/bids/                    - Create bid
- GET    /api/bids/my_bids/            - Bid history

Payments (NEW):
- POST   /api/payments/initiate/       - Initiate M-Pesa STK Push
- POST   /api/payments/callback/       - M-Pesa callback (webhook)
- GET    /api/payments/status/{uuid}/  - Check payment status

Public Pages:
- GET    /                             - Home page
- GET    /browse/                      - Browse auctions
- GET    /auctions/{uuid}/             - Auction detail
- GET    /accounts/login/              - Login page
- GET    /accounts/signup/             - Signup page
- GET    /admin-panel/                 - Seller dashboard
"""