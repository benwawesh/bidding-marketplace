from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser, AllowAny
from .models import PromoBarSettings
from .serializers import PromoBarSettingsSerializer


class PromoBarSettingsAPIView(APIView):
    """
    GET: Fetch active promo bar settings (public)
    PUT/PATCH: Update promo bar settings (admin only)
    """

    def get_permissions(self):
        """Allow GET for everyone, PUT/PATCH for admins only"""
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdminUser()]

    def get(self, request):
        """Get the active promo bar settings"""
        try:
            # Get the active promo bar
            promo_bar = PromoBarSettings.objects.filter(is_active=True).first()

            if not promo_bar:
                # Return default settings if none exist
                return Response({
                    'brand_text': 'BIDSOKO LUXE',
                    'brand_text_mobile': 'BIDSOKO',
                    'brand_emoji': '🎯',
                    'phone_number': '0711 011 011',
                    'phone_emoji': '📞',
                    'announcement_text': '🚚 Free Delivery on Orders Over KES 5,000',
                    'cta_text': 'SHOP NOW',
                    'cta_link': '/browse',
                    'background_color': '#f9e5c9',
                    'text_color': '#1f2937',
                    'accent_color': '#ea580c',
                    'is_active': True,
                })

            serializer = PromoBarSettingsSerializer(promo_bar)
            return Response(serializer.data)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def put(self, request):
        """Update the active promo bar settings (admin only)"""
        try:
            # Get or create the active promo bar
            promo_bar = PromoBarSettings.objects.filter(is_active=True).first()

            if promo_bar:
                # Update existing
                serializer = PromoBarSettingsSerializer(promo_bar, data=request.data, partial=True)
            else:
                # Create new
                serializer = PromoBarSettingsSerializer(data=request.data)

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def patch(self, request):
        """Partial update of promo bar settings (admin only)"""
        return self.put(request)
