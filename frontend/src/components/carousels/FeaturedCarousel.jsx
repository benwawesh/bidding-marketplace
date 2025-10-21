import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/helpers';

export default function FeaturedCarousel({ products = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const totalSlides = products.length;

  useEffect(() => {
    checkScroll();
  }, [currentIndex, totalSlides]);

  const checkScroll = () => {
    setAtStart(currentIndex === 0);
    setAtEnd(currentIndex === totalSlides - 1);
  };

  const scrollLeft = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const scrollRight = () => {
    if (currentIndex < totalSlides - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="bg-white rounded shadow-sm mb-4">
      <div className="border-b px-4 py-3 flex items-center justify-between bg-red-50">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path>
          </svg>
          <h2 className="font-bold text-gray-900 uppercase">Live Auctions - Bid to Win</h2>
        </div>
        <a href="#auctions" className="text-red-600 hover:text-red-700 font-semibold text-sm uppercase smooth-transition">
          See All →
        </a>
      </div>

      <div className="p-4">
        <div className="relative">
          {/* Left Arrow */}
          {!atStart && (
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-full p-4 shadow-lg transition"
            >
              <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
          )}

          {/* Products Container */}
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {products.map((product) => (
                <div key={product.id} className="w-full flex-shrink-0 px-12">
                  {/* Large Featured Product Card */}
                  <div className="product-card bg-white rounded-lg overflow-hidden shadow-xl max-w-5xl mx-auto">
                    <Link to={`/auction/${product.id}`} className="block">
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Product Image - Left Side */}
                        <div className="relative bg-gray-100 aspect-square overflow-hidden">
                          {product.main_image ? (
                            <img 
                              src={product.main_image} 
                              alt={product.title} 
                              className="product-image w-full h-full object-cover"
                            />
                          ) : (
                            <div className="product-image w-full h-full flex items-center justify-center bg-gradient-to-br from-red-100 to-red-200">
                              <svg className="w-32 h-32 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                            </div>
                          )}

                          {/* Badges */}
                          <div className="absolute top-4 left-4 flex gap-2">
                            <span className="badge bg-red-600 text-white text-sm font-bold px-3 py-2 rounded-lg shadow-lg">
                              🔥 LIVE AUCTION
                            </span>
                            {product.status === 'active' && (
                              <span className="badge bg-red-500 text-white text-sm font-bold px-3 py-2 rounded-lg flex items-center gap-2 shadow-lg">
                                <span className="pulse-dot w-2 h-2 bg-white rounded-full"></span>
                                LIVE NOW
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Product Info - Right Side */}
                        <div className="p-6 flex flex-col justify-center">
                          {/* Title */}
                          <h3 className="text-3xl font-bold text-gray-900 mb-4 hover:text-red-600 smooth-transition">
                            {product.title}
                          </h3>

                          {/* Description */}
                          <p className="text-gray-600 mb-6 text-lg line-clamp-3">
                            {product.description || "Join this exciting auction and place your bid to win this amazing product!"}
                          </p>

                          {/* Pricing */}
                          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 mb-6">
                            <div>
                              <span className="text-sm text-gray-600 uppercase tracking-wide">Bidding Starts At</span>
                              <div className="product-price text-4xl font-bold text-red-600 mt-1">
                                {formatCurrency(product.base_price)}
                              </div>
                              <p className="text-sm text-orange-600 mt-2 font-semibold">
                                🏆 Win at unbeatable prices - Join now!
                              </p>
                            </div>
                          </div>

                          {/* Status */}
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4 text-center mb-6">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <span className="pulse-dot w-3 h-3 bg-green-500 rounded-full"></span>
                              <div className="text-2xl font-bold text-green-700">AUCTION LIVE</div>
                            </div>
                            <div className="text-sm text-green-600 font-medium">Compete with others to win!</div>
                          </div>

                          {/* CTA Button */}
                          <button className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-5 rounded-xl font-bold text-xl hover:from-red-700 hover:to-red-800 transition shadow-lg transform hover:scale-105 flex items-center justify-center gap-3">
                            <span className="text-2xl">🎯</span>
                            <span>Start Bidding Now</span>
                          </button>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Arrow */}
          {!atEnd && (
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-full p-4 shadow-lg transition"
            >
              <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          )}

          {/* Dot Indicators */}
          {totalSlides > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {products.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    currentIndex === index ? 'bg-red-600 w-8' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                ></button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
