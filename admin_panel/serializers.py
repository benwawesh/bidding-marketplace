from rest_framework import serializers
from .models import PromoBarSettings


class PromoBarSettingsSerializer(serializers.ModelSerializer):
    """Serializer for PromoBar settings"""

    class Meta:
        model = PromoBarSettings
        fields = [
            'id',
            'brand_text',
            'brand_text_mobile',
            'brand_emoji',
            'phone_number',
            'phone_emoji',
            'announcement_text',
            'cta_text',
            'cta_link',
            'background_color',
            'text_color',
            'accent_color',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
