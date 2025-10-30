from django.urls import path
from . import views

app_name = 'admin_panel'

urlpatterns = [
    # Dashboard home
    path('', views.DashboardHomeView.as_view(), name='dashboard'),

    # Auction management
    path('auctions/', views.AuctionListView.as_view(), name='auction_list'),
    path('auctions/create/', views.AuctionCreateView.as_view(), name='auction_create'),
    path('auctions/<uuid:auction_id>/', views.AuctionDetailView.as_view(), name='auction_detail'),
    path('auctions/<uuid:auction_id>/edit/', views.AuctionEditView.as_view(), name='auction_edit'),
    path('auctions/<uuid:auction_id>/activate/', views.ActivateAuctionView.as_view(), name='activate_auction'),
    path('auctions/<uuid:auction_id>/close/', views.CloseAuctionView.as_view(), name='close_auction'),
    path('auctions/<uuid:auction_id>/create-round/', views.CreateRoundView.as_view(), name='create_round'),
    path('auctions/<uuid:auction_id>/participants/', views.ParticipantsView.as_view(), name='participants'),

    # Order Management (NEW)
    path('orders/', views.OrderListView.as_view(), name='order_list'),
    path('orders/<uuid:order_id>/', views.OrderDetailView.as_view(), name='order_detail'),
    path('orders/<uuid:order_id>/update-status/', views.UpdateOrderStatusView.as_view(), name='update_order_status'),

    # Analytics & Reports
    path('revenue/', views.RevenueReportView.as_view(), name='revenue_report'),

    # Settings
    path('settings/', views.SettingsView.as_view(), name='settings'),

    # Promo Bar Management
    path('promobar/', views.PromoBarManagementView.as_view(), name='promobar_management'),
    path('promobar/create/', views.PromoBarCreateView.as_view(), name='promobar_create'),
    path('promobar/<int:promo_id>/update/', views.PromoBarUpdateView.as_view(), name='promobar_update'),
    path('promobar/<int:promo_id>/delete/', views.PromoBarDeleteView.as_view(), name='promobar_delete'),
]