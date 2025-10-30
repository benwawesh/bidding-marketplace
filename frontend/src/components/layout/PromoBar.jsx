import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function PromoBar() {
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

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
    announcement_texts = ['🚚 Free Delivery on Orders Over KES 5,000'],
    cta_text = 'SHOP NOW',
    cta_link = '/browse',
    background_color = '#f9e5c9',
    text_color = '#1f2937',
    accent_color = '#ea580c',
  } = settings || {};

  // Rotate announcements every 4 seconds
  useEffect(() => {
    if (announcement_texts.length <= 1) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentAnnouncementIndex((prev) => (prev + 1) % announcement_texts.length);
        setIsAnimating(false);
      }, 500); // Half of transition time
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [announcement_texts.length]);

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
          {/* Left Side - Brand Only */}
          <div className="flex items-center">
            <span
              className="text-base sm:text-xl font-bold tracking-wide whitespace-nowrap"
              style={{ color: accent_color }}
            >
              {brand_emoji} <span className="hidden sm:inline">{brand_text}</span>
              <span className="sm:hidden">{brand_text_mobile}</span>
            </span>
          </div>

          {/* Center - Phone + Announcement (Takes most space) - Desktop */}
          <div className="flex-1 hidden md:flex items-center justify-center gap-2 overflow-hidden px-4">
            <span className="text-sm font-semibold whitespace-nowrap">
              {phone_emoji} <span style={{ color: accent_color }} className="font-bold">{phone_number}</span>
            </span>
            <span className="text-gray-400">•</span>
            <div className="relative h-6 flex-1 max-w-2xl">
              <p
                className={`absolute inset-0 text-sm font-bold text-center transition-all duration-700 flex items-center justify-center ${
                  isAnimating ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
                }`}
                style={{ color: accent_color }}
              >
                {announcement_texts[currentAnnouncementIndex]}
              </p>
            </div>
          </div>

          {/* Center - Phone + Announcement - Tablet */}
          <div className="flex-1 hidden sm:flex md:hidden items-center justify-center gap-2 overflow-hidden px-2">
            <span className="text-xs font-semibold whitespace-nowrap">
              {phone_emoji} <span style={{ color: accent_color }} className="font-bold">{phone_number}</span>
            </span>
            <span className="text-gray-400 text-xs">•</span>
            <div className="relative h-5 flex-1">
              <p
                className={`absolute inset-0 text-xs font-bold text-center transition-all duration-700 flex items-center justify-center ${
                  isAnimating ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
                }`}
                style={{ color: accent_color }}
              >
                {announcement_texts[currentAnnouncementIndex]}
              </p>
            </div>
          </div>

          {/* Mobile: Announcement only */}
          <div className="flex-1 sm:hidden overflow-hidden px-2">
            <div className="relative h-5">
              <p
                className={`absolute inset-0 text-xs font-bold text-center transition-all duration-700 flex items-center justify-center ${
                  isAnimating ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
                }`}
                style={{ color: accent_color }}
              >
                {announcement_texts[currentAnnouncementIndex]}
              </p>
            </div>
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
