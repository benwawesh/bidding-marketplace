from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import PromoBanner


@api_view(['GET'])
@permission_classes([AllowAny])
def get_active_promo_banners(request):
    """Get all active promotional banners"""
    banners = PromoBanner.objects.filter(is_active=True).order_by('display_order')
    
    data = [
        {
            'id': str(banner.id),
            'text': banner.text,
            'background_color': banner.background_color,
            'text_color': banner.text_color,
        }
        for banner in banners
    ]
    
    return Response(data)
