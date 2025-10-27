import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '../../api/axios';
import { formatCurrency } from '../../utils/helpers';
import './HeroAuctionSection.css';

export default function HeroAuctionSection({ auction }) {
  // Fetch active promo banners
  const { data: promoBanners = [] } = useQuery({
    queryKey: ['promo-banners'],
    queryFn: () => axios.get('/api/promo-banners/').then(res => res.data),
  });

  if (!auction) {
    return (
      <div className="hero-auction-empty bg-white rounded-lg p-8 text-center mb-6 shadow-md">
        <div className="text-4xl mb-3">🎯</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No Live Auctions</h2>
        <p className="text-gray-600 text-sm">Check back soon for amazing bidding opportunities!</p>
      </div>
    );
  }

  // CORRECT PRICING LOGIC
  const marketPrice = auction.market_price || auction.base_price * 50;
  const bidPrice = auction.base_price;
  const savings = marketPrice - bidPrice;
  const savingsPercent = Math.round((savings / marketPrice) * 100);

  return (
    <div className="hero-auction-section relative mb-6">
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

      {/* Single Container - Same background as home section */}
      <div className="hero-auction-content bg-orange-200 rounded-xl shadow-xl overflow-hidden border-2 border-red-400">
        
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

        <div className="grid grid-cols-1 lg:grid-cols-5">
          
          {/* Left Side - Product Image (60%) - ROSE COLOR */}
          <div className="lg:col-span-3 relative flex items-center justify-center overflow-hidden">
            {auction.main_image ? (
              <img
                src={auction.main_image.startsWith('http')
                  ? auction.main_image
                  : `${auction.main_image}`
                }
                alt={auction.title}
                className="w-full h-full object-cover min-h-[450px]"
              />
            ) : (
              <div className="text-6xl opacity-20">🎯</div>
            )}

            {/* LIVE Badge - Blinking */}
            <div className="absolute top-2 left-2">
              <span className="live-badge bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                <span className="live-dot"></span>
                🔴 LIVE
              </span>
            </div>
          </div>

          {/* Right Side - Product Details (40%) - DARK ORANGE COLOR */}
          <div className="lg:col-span-2 flex flex-col justify-center p-6">
            
            {/* Category */}
            {auction.category_name && (
              <span className="inline-block bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-3 w-fit">
                {auction.category_name}
              </span>
            )}

            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-black text-gray-900 mb-3 leading-tight">
              {auction.title}
            </h1>

            {/* Description */}
            {auction.description && (
              <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                {auction.description}
              </p>
            )}

            {/* Pricing Section */}
            <div className="space-y-3 mb-4">
              
              {/* Market Price - Strikethrough */}
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-500 line-through decoration-red-500 decoration-2">
                  {formatCurrency(marketPrice)}
                </span>
                <span className="text-red-500 font-bold">❌</span>
              </div>

              {/* ⭐ Current Bid Price - REMOVED animate-pulse-slow - Now Static/Still */}
              <div className="bg-amber-100 border-2 border-amber-300 rounded-lg p-4 overflow-hidden">
                <p className="text-amber-900 text-xs font-bold uppercase tracking-wider mb-1">
                  🎉 Pledge Your Bid From
                </p>
                <p className="text-4xl font-black text-amber-900 mb-1">
                  {formatCurrency(bidPrice)}
                </p>
                
                {/* Sliding Savings Text */}
                <div className="savings-slider-container relative h-8 overflow-hidden">
                  <div className="savings-slide-wrapper">
                    <p className="savings-text text-lg font-bold text-orange-700">
                      🔥 SAVE {formatCurrency(savings)} ({savingsPercent}% OFF!)
                    </p>
                    <p className="savings-text text-lg font-bold text-orange-700">
                      🔥 SAVE {formatCurrency(savings)} ({savingsPercent}% OFF!)
                    </p>
                    <p className="savings-text text-lg font-bold text-orange-700">
                      🔥 SAVE {formatCurrency(savings)} ({savingsPercent}% OFF!)
                    </p>
                  </div>
                </div>
              </div>

              {/* Pay on Delivery Badge */}
              <div className="flex items-center justify-center gap-2 bg-blue-50 border border-blue-400 rounded-lg px-4 py-3">
                <span className="text-2xl">🚚</span>
                <p className="text-blue-900 font-bold text-base">PAY ON DELIVERY</p>
              </div>
            </div>

            {/* Call to Action Button */}
            <Link
              to={`/auction/${auction.id}`}
              className="cta-button relative bg-red-600 text-white px-8 py-4 rounded-xl text-lg font-black uppercase tracking-wide shadow-lg flex items-center justify-center gap-3 overflow-hidden"
            >
              <span className="cta-shimmer"></span>
              <span className="relative z-10">JOIN THE BID NOW!</span>
            </Link>

            {/* Urgency Message - With Sliding Effect */}
            <div className="urgency-slider-container relative h-6 overflow-hidden mt-3">
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
