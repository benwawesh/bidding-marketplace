import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/helpers';

export default function HeroCarousel({ products = [] }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (products.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % products.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [products.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % products.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + products.length) % products.length);
  };

  if (!products || products.length === 0) {
    return (
      <div className="hero-carousel bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-12 text-center">
        <h2 className="text-2xl font-bold text-gray-600 mb-4">No Live Auctions</h2>
        <p className="text-gray-500">Check back soon for amazing bidding opportunities!</p>
      </div>
    );
  }

  return (
    <div className="hero-carousel relative rounded-lg overflow-hidden shadow-xl bg-white">
      {/* Slides */}
      <div className="relative h-[300px] sm:h-[400px] lg:h-[500px]">
        {products.map((product, index) => (
          <div
            key={product.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
              {/* Left Side - Image */}
              <div className="relative bg-gradient-to-br from-red-50 to-red-100">
                {product.main_image ? (
                  <img
                    src={product.main_image.startsWith('http')
                      ? product.main_image
                      : `${product.main_image}`
                    }
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-9xl opacity-20">🎯</span>
                  </div>
                )}

                {/* Overlay Badge - Changed to LIVE AUCTION */}
                <div className="absolute top-6 left-6 flex gap-2">
                  <span className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    LIVE AUCTION
                  </span>
                </div>
              </div>

              {/* Right Side - Content */}
              <div className="flex flex-col justify-center p-8 lg:p-12 bg-white">
                {/* Category */}
                {product.category_name && (
                  <span className="text-red-600 font-semibold text-sm uppercase tracking-wide mb-2">
                    {product.category_name}
                  </span>
                )}

                {/* Title */}
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                  {product.title}
                </h2>

                {/* Description */}
                {product.description && (
                  <p className="text-gray-600 text-lg mb-6 line-clamp-3">
                    {product.description}
                  </p>
                )}

                {/* Pricing Info */}
                <div className="space-y-4 mb-8">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Bidding Starts At</div>
                    <div className="text-4xl font-bold text-red-600">
                      {formatCurrency(product.base_price)}
                    </div>
                  </div>

                  {product.highest_bid && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                      <div className="text-sm text-green-700 font-semibold mb-1">Current Highest Bid</div>
                      <div className="text-3xl font-bold text-green-700">
                        {formatCurrency(product.highest_bid)}
                      </div>
                    </div>
                  )}

                  {/* Auction Live Status */}
                  {product.status === 'active' && (
                    <div className="inline-flex items-center gap-2 bg-green-50 border border-green-300 rounded-lg px-4 py-2">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-green-800 font-semibold">AUCTION LIVE</span>
                      <span className="text-green-600 text-sm">• Compete with others to win!</span>
                    </div>
                  )}

                  {/* Participants */}
                  {product.participant_count > 0 && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <span className="text-2xl">👥</span>
                      <span className="font-bold text-lg">{product.participant_count}</span>
                      <span className="text-gray-600">participants bidding</span>
                    </div>
                  )}

                  {/* Win at unbeatable prices message */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-lg p-4">
                    <p className="text-orange-700 font-bold text-center text-lg">
                      🏆 WIN at unbeatable prices - Join now!
                    </p>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="flex gap-4">
                  <Link
                    to={`/auction/${product.id}`}
                    className="flex-1 bg-red-600 text-white px-8 py-4 rounded-lg text-xl font-bold hover:bg-red-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <span>🎯</span>
                    <span>Start Bidding Now</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {products.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all hover:scale-110"
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all hover:scale-110"
            aria-label="Next slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {products.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-red-600 w-8'
                  : 'bg-white/60 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
