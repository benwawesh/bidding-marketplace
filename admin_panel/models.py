from django.db import models


class PromoBarSettings(models.Model):
    """
    Settings for the promotional banner displayed across the site.
    Only one active instance should exist at a time.
    """
    # Left side branding
    brand_text = models.CharField(
        max_length=100,
        default="BIDSOKO LUXE",
        help_text="Brand text displayed on the left (e.g., 'BIDSOKO LUXE')"
    )
    brand_text_mobile = models.CharField(
        max_length=50,
        default="BIDSOKO",
        help_text="Shorter brand text for mobile devices"
    )
    brand_emoji = models.CharField(
        max_length=10,
        default="🎯",
        help_text="Emoji displayed before brand text"
    )

    # Center announcement
    phone_number = models.CharField(
        max_length=20,
        default="0711 011 011",
        help_text="Contact phone number"
    )
    phone_emoji = models.CharField(
        max_length=10,
        default="📞",
        help_text="Emoji displayed before phone number"
    )
    announcement_text = models.TextField(
        default="🚚 Free Delivery on Orders Over KES 5,000",
        help_text="Announcement texts separated by '|' (pipe). Example: '🚚 Free Delivery|⚡ Flash Sale Today|🎉 50% Off Selected Items'"
    )

    # Right side CTA button
    cta_text = models.CharField(
        max_length=50,
        default="SHOP NOW",
        help_text="Call-to-action button text"
    )
    cta_link = models.CharField(
        max_length=200,
        default="/browse",
        help_text="Link for the CTA button (e.g., '/browse', '/auctions')"
    )

    # Styling
    background_color = models.CharField(
        max_length=20,
        default="#f9e5c9",
        help_text="Background color (hex code or color name)"
    )
    text_color = models.CharField(
        max_length=20,
        default="#1f2937",
        help_text="Text color (hex code or color name)"
    )
    accent_color = models.CharField(
        max_length=20,
        default="#ea580c",
        help_text="Accent color for highlights (hex code or color name)"
    )

    # Control
    is_active = models.BooleanField(
        default=True,
        help_text="Display this promo bar on the site"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Promo Bar Setting"
        verbose_name_plural = "Promo Bar Settings"
        ordering = ['-is_active', '-updated_at']

    def __str__(self):
        status = "Active" if self.is_active else "Inactive"
        return f"Promo Bar - {status} ({self.brand_text})"

    def save(self, *args, **kwargs):
        """Ensure only one active promo bar exists"""
        if self.is_active:
            # Deactivate all other promo bars
            PromoBarSettings.objects.filter(is_active=True).update(is_active=False)
        super().save(*args, **kwargs)
