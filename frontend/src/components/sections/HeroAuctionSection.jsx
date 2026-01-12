import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '../../api/axios';
import { formatCurrency } from '../../utils/helpers';
import { getRounds } from '../../api/bidAPI';
import './HeroAuctionSection.css';

export default function HeroAuctionSection({ auction }) {
  // Fetch active promo banners
  const { data: promoBanners = [] } = useQuery({
    queryKey: ['promo-banners'],
    queryFn: () => axios.get('/promo-banners/').then(res => res.data),
  });

  // Fetch rounds to check if there's an active round
  const { data: rounds = [] } = useQuery({
    queryKey: ['hero-rounds', auction?.id],
    queryFn: () => getRounds(auction.id),
    enabled: !!auction,
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

  // Check if there's an active round
  const hasActiveRound = rounds.some(r => r.is_active);
  const isAuctionEnded = !hasActiveRound;

  // CORRECT PRICING LOGIC
  const marketPrice = auction.market_price || auction.base_price * 50;
  const bidPrice = auction.base_price;
  const savings = marketPrice - bidPrice;
  const savingsPercent = Math.round((savings / marketPrice) * 100);

  return (
    <div className="hero-auction-section mb-4 md:mb-6">
      {/* Animated Promo Banners - Above Everything */}
      {promoBanners.length > 0 && (
        <div className="promo-banners-wrapper mb-4">
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

      {/* Main Grid: Image on Left, Bidding Card on Right */}
      <div className="flex flex-col lg:flex-row gap-4">

        {/* Left Side: Product Image and Info */}
        <div className="flex-1">
          {/* Product Image Section */}
          <div className="relative rounded-t-lg overflow-hidden shadow-lg bg-gray-100">
            <div className="relative h-80 md:h-96 lg:h-[500px] xl:h-[600px]">
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
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <div className="text-8xl opacity-20">🎯</div>
                </div>
              )}

              {/* LIVE/ENDED Badge */}
              <div className="absolute top-4 left-4 md:top-6 md:left-6">
                {isAuctionEnded ? (
                  <span className="bg-gray-800 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-lg text-sm md:text-base font-semibold shadow-lg">
                    Ended
                  </span>
                ) : (
                  <span className="bg-green-600 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-lg text-sm md:text-base font-semibold flex items-center gap-2 shadow-lg">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    Live
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Product Information Below Image */}
          <div className="bg-white rounded-b-lg shadow-lg p-4 md:p-6">
            {/* Category */}
            {auction.category_name && (
              <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium mb-3">
                {auction.category_name}
              </span>
            )}

            {/* Title */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 leading-tight">
              {auction.title}
            </h1>

            {/* Description */}
            {auction.description && (
              <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                {auction.description}
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Bidding Card (Sidebar Style) */}
        <div className="w-full lg:w-96 flex-shrink-0">
          <div className="bg-yellow-50 rounded-lg shadow-lg border-2 border-yellow-200 p-4 md:p-6 sticky top-4">
            <div className="space-y-4">

              {/* Pricing Information */}
              <div className="pb-4 border-b border-gray-200">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Pricing
                </h3>

                {/* Market Price */}
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Market Price</p>
                  <p className="text-lg md:text-xl text-gray-400 line-through">
                    {formatCurrency(marketPrice)}
                  </p>
                </div>

                {/* Savings Badge */}
                <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-green-700 font-semibold">
                    Save {savingsPercent}%
                  </span>
                </div>
              </div>

              {/* Bidding Action */}
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                {/* Pledge Your Bid From */}
                <div className="text-center mb-3">
                  <p className="text-sm text-gray-700 mb-2">🎉 Pledge Your Bid From</p>
                  <p className="text-3xl md:text-4xl font-bold text-orange-600">
                    {formatCurrency(bidPrice)}
                  </p>
                </div>

                {/* Savings Banner - Sliding Animation */}
                {!isAuctionEnded && (
                  <div className="savings-slider-container relative h-8 overflow-hidden bg-orange-500 text-white rounded-lg mb-3">
                    <div className="savings-slide-wrapper">
                      <p className="savings-text text-sm font-bold">
                        🔥 SAVE {formatCurrency(savings)} ({savingsPercent}% OFF!)
                      </p>
                      <p className="savings-text text-sm font-bold">
                        🔥 SAVE {formatCurrency(savings)} ({savingsPercent}% OFF!)
                      </p>
                      <p className="savings-text text-sm font-bold">
                        🔥 SAVE {formatCurrency(savings)} ({savingsPercent}% OFF!)
                      </p>
                    </div>
                  </div>
                )}

                {/* Pay on Delivery Badge */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 flex items-center justify-center gap-2">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  <span className="text-orange-600 font-bold text-sm">PAY ON DELIVERY</span>
                </div>

                {/* CTA Button */}
                <Link
                  to={`/auction/${auction.id}`}
                  className={`flex items-center justify-center gap-2 w-full ${
                    isAuctionEnded
                      ? 'bg-gray-700 hover:bg-gray-800'
                      : 'bg-red-600 hover:bg-red-700'
                  } text-white px-4 py-3 rounded-lg text-base font-bold transition-all hover:shadow-lg`}
                >
                  {isAuctionEnded ? 'VIEW DETAILS' : 'JOIN THE BID NOW!'}
                </Link>

                {/* Urgency Message - Sliding Animation */}
                {!isAuctionEnded && (
                  <div className="urgency-slider-container relative h-6 overflow-hidden mt-3">
                    <div className="urgency-slide-wrapper">
                      <p className="urgency-text text-center text-blue-600 font-bold text-xs">
                        ⚡ LIMITED TIME - BID NOW! ⚡
                      </p>
                      <p className="urgency-text text-center text-blue-600 font-bold text-xs">
                        ⚡ LIMITED TIME - BID NOW! ⚡
                      </p>
                      <p className="urgency-text text-center text-blue-600 font-bold text-xs">
                        ⚡ LIMITED TIME - BID NOW! ⚡
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
