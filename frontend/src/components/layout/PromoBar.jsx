import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export default function PromoBar() {
  // Fetch promo bar settings from API
  const { data: settings } = useQuery({
    queryKey: ['promobar-settings'],
    queryFn: () => axios.get('/api/settings/promobar/').then(res => res.data),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Default values if API hasn't loaded yet
  const {
    brand_text = 'BIDSOKO LUXE',
    brand_text_mobile = 'BIDSOKO',
    brand_emoji = '🎯',
    phone_number = '0711 011 011',
    phone_emoji = '📞',
    announcement_text = '🚚 Free Delivery on Orders Over KES 5,000',
    cta_text = 'SHOP NOW',
    cta_link = '/browse',
    background_color = '#f9e5c9',
    text_color = '#1f2937',
    accent_color = '#ea580c',
  } = settings || {};

  return (
    <div
      className="border-b border-orange-200"
      style={{
        backgroundColor: background_color,
        color: text_color
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left Side - Brand/Highlight - Mobile Responsive */}
          <div className="flex items-center">
            <span
              className="text-base sm:text-xl font-bold tracking-wide"
              style={{ color: accent_color }}
            >
              {brand_emoji} <span className="hidden sm:inline">{brand_text}</span>
              <span className="sm:hidden">{brand_text_mobile}</span>
            </span>
          </div>

          {/* Center - Announcement/Highlight - Mobile Responsive */}
          <div className="flex-1 text-center hidden sm:block">
            <p className="text-xs md:text-sm font-semibold">
              {phone_emoji} <span style={{ color: accent_color }} className="font-bold">{phone_number}</span> |
              <span className="ml-2 hidden md:inline">{announcement_text}</span>
            </p>
          </div>

          {/* Mobile: Show phone number only */}
          <div className="flex-1 text-center sm:hidden">
            <p className="text-xs font-semibold">
              {phone_emoji} <span style={{ color: accent_color }} className="font-bold">{phone_number}</span>
            </p>
          </div>

          {/* Right Side - CTA Button - Mobile Responsive */}
          <Link
            to={cta_link}
            className="text-white px-3 py-1.5 sm:px-6 sm:py-2 rounded-full font-bold text-xs sm:text-sm hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 whitespace-nowrap"
            style={{ backgroundColor: accent_color }}
          >
            {cta_text}
          </Link>
        </div>
      </div>
    </div>
  );
}
