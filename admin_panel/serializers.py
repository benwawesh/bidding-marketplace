from rest_framework import serializers
from .models import PromoBarSettings


class PromoBarSettingsSerializer(serializers.ModelSerializer):
    """Serializer for PromoBar settings"""
    announcement_texts = serializers.SerializerMethodField()

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
            'announcement_texts',
            'cta_text',
            'cta_link',
            'background_color',
            'text_color',
            'accent_color',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'announcement_texts']

    def get_announcement_texts(self, obj):
        """Split announcement_text by pipe and return as array"""
        if obj.announcement_text:
            return [text.strip() for text in obj.announcement_text.split('|') if text.strip()]
        return []
