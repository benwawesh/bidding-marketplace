import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '../../api/axios';
import { formatCurrency } from '../../utils/helpers';
import './HeroAuctionSection.css';

export default function HeroAuctionSection({ auction }) {
  // Fetch active promo banners
  const { data: promoBanners = [] } = useQuery({
    queryKey: ['promo-banners'],
    queryFn: () => axios.get('/promo-banners/').then(res => res.data),
  });

  if (!auction) {
    return (
      <div className="hero-auction-empty bg-white rounded-lg p-4 sm:p-8 text-center mb-4 sm:mb-6 shadow-md">
        <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🎯</div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">No Live Auctions</h2>
        <p className="text-gray-600 text-xs sm:text-sm">Check back soon for amazing bidding opportunities!</p>
      </div>
    );
  }

  // CORRECT PRICING LOGIC
  const marketPrice = auction.market_price || auction.base_price * 50;
  const bidPrice = auction.base_price;
  const savings = marketPrice - bidPrice;
  const savingsPercent = Math.round((savings / marketPrice) * 100);

  return (
    <div className="hero-auction-section relative mb-4 sm:mb-6">
      {/* Fireworks Animation Background */}
      <div className="fireworks-container">
        <div className="firework"></div>
        <div className="firework"></div>
        <div className="firework"></div>
        <div className="firework"></div>
        <div className="firework"></div>
        <div className="firework"></div>
        <div className="firework"></div>
        <div className="firework"></div>
        <div className="firework"></div>
        <div className="firework"></div>
        <div className="firework"></div>
        <div className="firework"></div>
      </div>

      {/* Single Container - Mobile Responsive */}
      <div className="hero-auction-content bg-orange-200 rounded-lg sm:rounded-xl shadow-xl overflow-hidden border-2 border-red-400">
        
        {/* Animated Promo Banners - Inside Container at Top */}
        {promoBanners.length > 0 && (
          <div className="promo-banners-wrapper">
            {promoBanners.map((banner) => (
              <div
                key={banner.id}
                className="promo-banner-item"
                style={{
                  backgroundColor: banner.background_color,
                  color: banner.text_color,
                }}
              >
                <div className="promo-text-animate">
                  <span>{banner.text}</span>
                  <span>{banner.text}</span>
                  <span>{banner.text}</span>
                  <span>{banner.text}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mobile: Image takes 60% height, Desktop: 60% width */}
        <div className="flex flex-col lg:grid lg:grid-cols-5">

          {/* Left Side - Product Image - Larger on mobile (60% of height) */}
          <div className="lg:col-span-3 relative flex items-center justify-center overflow-hidden aspect-[16/9] lg:aspect-auto lg:min-h-[400px]">
            {auction.main_image ? (
              <img
                src={auction.main_image.startsWith('http')
                  ? auction.main_image
                  : `${auction.main_image}`
                }
                alt={auction.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-6xl opacity-20">🎯</div>
            )}

            {/* LIVE Badge - Blinking - Mobile Responsive */}
            <div className="absolute top-1 left-1 sm:top-2 sm:left-2">
              <span className="live-badge bg-green-600 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg flex items-center gap-1 sm:gap-2">
                <span className="live-dot"></span>
                🔴 LIVE
              </span>
            </div>
          </div>

          {/* Right Side - Product Details - Compact Mobile Layout */}
          <div className="lg:col-span-2 flex flex-col justify-center p-3 sm:p-6">

            {/* Category - Mobile Responsive */}
            {auction.category_name && (
              <span className="inline-block bg-red-600 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-1 sm:mb-3 w-fit">
                {auction.category_name}
              </span>
            )}

            {/* Title - Compact Mobile */}
            <h1 className="text-base sm:text-2xl lg:text-3xl font-black text-gray-900 mb-1 sm:mb-3 leading-tight">
              {auction.title}
            </h1>

            {/* Description - Hidden on mobile for space */}
            {auction.description && (
              <p className="text-gray-700 text-xs sm:text-sm mb-2 sm:mb-4 line-clamp-1 sm:line-clamp-2 hidden sm:block">
                {auction.description}
              </p>
            )}

            {/* Pricing Section - Compact Mobile */}
            <div className="space-y-1 sm:space-y-3 mb-2 sm:mb-4">

              {/* Market Price - Strikethrough - Compact */}
              <div className="flex items-center gap-1 sm:gap-3">
                <span className="text-sm sm:text-2xl font-bold text-gray-500 line-through decoration-red-500 decoration-2">
                  {formatCurrency(marketPrice)}
                </span>
                <span className="text-red-500 font-bold text-xs sm:text-base">❌</span>
              </div>

              {/* Current Bid Price - Compact Mobile */}
              <div className="bg-amber-100 border-2 border-amber-300 rounded-lg p-2 sm:p-4 overflow-hidden">
                <p className="text-amber-900 text-xs font-bold uppercase tracking-wider mb-0.5 sm:mb-1">
                  🎉 Pledge Your Bid From
                </p>
                <p className="text-xl sm:text-3xl lg:text-4xl font-black text-amber-900 mb-0.5 sm:mb-1">
                  {formatCurrency(bidPrice)}
                </p>

                {/* Sliding Savings Text - Compact */}
                <div className="savings-slider-container relative h-5 sm:h-8 overflow-hidden">
                  <div className="savings-slide-wrapper">
                    <p className="savings-text text-sm sm:text-lg font-bold text-orange-700">
                      🔥 SAVE {formatCurrency(savings)} ({savingsPercent}% OFF!)
                    </p>
                    <p className="savings-text text-sm sm:text-lg font-bold text-orange-700">
                      🔥 SAVE {formatCurrency(savings)} ({savingsPercent}% OFF!)
                    </p>
                    <p className="savings-text text-sm sm:text-lg font-bold text-orange-700">
                      🔥 SAVE {formatCurrency(savings)} ({savingsPercent}% OFF!)
                    </p>
                  </div>
                </div>
              </div>

              {/* Pay on Delivery Badge - Compact Mobile */}
              <div className="flex items-center justify-center gap-1 sm:gap-2 bg-blue-50 border border-blue-400 rounded-lg px-2 sm:px-4 py-1.5 sm:py-3">
                <span className="text-base sm:text-2xl">🚚</span>
                <p className="text-blue-900 font-bold text-xs sm:text-base">PAY ON DELIVERY</p>
              </div>
            </div>

            {/* Call to Action Button - Compact Mobile */}
            <Link
              to={`/auction/${auction.id}`}
              className="cta-button relative bg-red-600 text-white px-3 sm:px-8 py-2.5 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-lg font-black uppercase tracking-wide shadow-lg flex items-center justify-center gap-1 sm:gap-3 overflow-hidden"
            >
              <span className="cta-shimmer"></span>
              <span className="relative z-10 text-center">JOIN THE BID NOW!</span>
            </Link>

            {/* Urgency Message - Compact Mobile */}
            <div className="urgency-slider-container relative h-4 sm:h-6 overflow-hidden mt-1 sm:mt-3">
              <div className="urgency-slide-wrapper">
                <p className="urgency-text text-center text-red-600 font-bold text-xs">
                  ⚡ LIMITED TIME - BID NOW! ⚡
                </p>
                <p className="urgency-text text-center text-red-600 font-bold text-xs">
                  ⚡ LIMITED TIME - BID NOW! ⚡
                </p>
                <p className="urgency-text text-center text-red-600 font-bold text-xs">
                  ⚡ LIMITED TIME - BID NOW! ⚡
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
