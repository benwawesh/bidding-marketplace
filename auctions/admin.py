from django.contrib import admin
from .models import (
    Category, Auction, Round, Participation,
    Bid, Payment, Cart, CartItem, Order, OrderItem, PromoBanner, ProductImage, HeroBanner
)

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(PromoBanner)
class PromoBannerAdmin(admin.ModelAdmin):
    list_display = ['text', 'is_active', 'display_order']
    list_filter = ['is_active']
    ordering = ['display_order']


@admin.register(HeroBanner)
class HeroBannerAdmin(admin.ModelAdmin):
    list_display = ['title', 'order', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['title', 'subtitle']
    ordering = ['order', 'created_at']
    list_editable = ['order', 'is_active']


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ['image', 'order', 'is_primary']
    readonly_fields = []


@admin.register(Auction)
class AuctionAdmin(admin.ModelAdmin):
    list_display = ['title', 'product_type', 'status', 'created_at']
    list_filter = ['product_type', 'status']
    search_fields = ['title']
    inlines = [ProductImageInline]

@admin.register(Round)
class RoundAdmin(admin.ModelAdmin):
    list_display = ['auction', 'round_number', 'is_active']
    list_filter = ['is_active']

@admin.register(Participation)
class ParticipationAdmin(admin.ModelAdmin):
    list_display = ['user', 'auction', 'round', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email']

@admin.register(Bid)
class BidAdmin(admin.ModelAdmin):
    list_display = ['user', 'auction', 'pledge_amount', 'submitted_at']
    list_filter = ['submitted_at']
    readonly_fields = ['submitted_at']

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['user', 'auction', 'amount', 'method', 'status']
    list_filter = ['status', 'method']

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['user', 'created_at']

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['cart', 'product', 'quantity']

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'user', 'status', 'created_at']
    list_filter = ['status']

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product', 'quantity', 'product_price']
