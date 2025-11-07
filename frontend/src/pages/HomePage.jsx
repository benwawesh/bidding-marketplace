import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auctionsAPI, categoriesAPI, cartAPI } from '../api/endpoints';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import HeroAuctionSection from '../components/sections/HeroAuctionSection';
import CategoriesGrid from '../components/sections/CategoriesGrid';
import BuyNowCard from '../components/cards/BuyNowCard';
import BothCard from '../components/cards/BothCard';
import ProductCarousel from '../components/carousel/ProductCarousel';
import { Link } from "react-router-dom";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Fetch data with auto-refresh every 30 seconds
  const { data: auctions = [], isLoading: auctionsLoading } = useQuery({
    queryKey: ['auctions'],
    queryFn: () => auctionsAPI.getAll().then(res => res.data?.results || res.data || []),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll().then(res => res.data?.results || res.data || []),
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: ({ product_id, quantity }) => 
      cartAPI.addToCart({ product_id, quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      toast.success('Added to cart!', {
        duration: 2000,
        position: 'top-center',
      });
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.error || 
                       error.response?.data?.message || 
                       'Failed to add to cart';
      toast.error(errorMsg, {
        duration: 3000,
        position: 'top-center',
      });
    },
  });

  // Filter products by type
  // Hero: Show FIRST active auction only
  const liveAuctions = auctions.filter(p => 
    (p.product_type === 'auction' || p.product_type === 'both') && 
    p.status === 'active'
  );
  const heroAuction = liveAuctions[0] || null; // Get first active auction
  
  // Buy Now: Horizontal carousel
  const buyNowProducts = auctions.filter(p => 
    (p.product_type === 'buy_now' || p.product_type === 'both') && 
    p.status === 'active'
  ).slice(0, 8);
  
  // Both Options: Horizontal carousel
  const bothProducts = auctions.filter(p => 
    p.product_type === 'both' && 
    p.status === 'active'
  ).slice(0, 8);

  // Stats for right sidebar
  const stats = {
    auctions: liveAuctions.length,
    buyNow: buyNowProducts.length,
    total: auctions.length,
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleAddToCart = (productId, quantity = 1) => {
    addToCartMutation.mutate({ product_id: productId, quantity });
  };

  if (auctionsLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="skeleton w-20 h-20 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading BidSoko...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden">
      {/* Search Bar */}
      <div className="bg-rose-50 w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <form className="relative max-w-3xl mx-auto">
            <div className="relative flex items-center">
              {/* Search Icon */}
              <div className="absolute left-4 text-gray-400 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <input
                type="text"
                placeholder="Search for products, auctions, categories..."
                className="flex-1 pl-12 pr-4 py-3 sm:py-4 text-sm sm:text-base bg-white rounded-full focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-300"
              />

              <button
                type="submit"
                className="absolute right-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-full font-semibold hover:from-orange-600 hover:to-rose-600 transition-all duration-300 text-sm sm:text-base transform hover:scale-105"
              >
                <span className="hidden sm:inline">Search</span>
                <span className="sm:hidden">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Main Content - Mobile First */}
      <div className="w-full">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-0 lg:gap-4">

            {/* Left Sidebar - Hidden on mobile */}
            <aside className="hidden lg:block lg:w-64 flex-shrink-0">
              <LeftSidebar categories={categories} />
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 w-full px-3 sm:px-4 py-4">
            
            {/* HERO SECTION - SINGLE LIVE AUCTION with FIREWORKS */}
            <HeroAuctionSection auction={heroAuction} />

            {/* Categories Grid */}
            <CategoriesGrid categories={categories} />

            {/* Buy Now Section - Jumia-Style Red Banner */}
            {buyNowProducts.length > 0 && (
              <section id="buy-now" className="my-6 sm:my-8 md:my-10">
                {/* Jumia-Style Red Banner Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-lg shadow-md mb-3 overflow-hidden">
                  <div className="flex items-center justify-between px-3 sm:px-4 py-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                      <h2 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase">
                        Flash Sale
                      </h2>
                    </div>
                    <Link
                      to="/buy-now"
                      className="group flex items-center gap-1 text-white hover:text-white/90 font-semibold text-xs sm:text-sm transition-all"
                    >
                      <span>SEE ALL</span>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>

                {/* Jumia-Style Horizontal Carousel */}
                <ProductCarousel>
                  {buyNowProducts.map((product) => (
                    <div key={product.id} className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px]">
                      <BuyNowCard product={product} />
                    </div>
                  ))}
                </ProductCarousel>
              </section>
            )}



            {/* Both Options Section - Enhanced Design */}
            {bothProducts.length > 0 && (
              <section className="my-6 sm:my-8 md:my-10">
                <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 border-b-2 border-rose-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-rose-500 to-orange-500 p-2 rounded-lg shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent">
                      Both Options - You Decide
                    </h2>
                  </div>
                </div>

                {/* Jumia-Style Horizontal Carousel */}
                <ProductCarousel>
                  {bothProducts.map(product => (
                    <div key={product.id} className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px]">
                      <BothCard product={product} />
                    </div>
                  ))}
                </ProductCarousel>
              </section>
            )}

            {/* Empty State - No Products at All */}
            {auctions.length === 0 && (
              <div className="bg-white rounded shadow-sm p-12 text-center">
                <svg className="mx-auto h-20 w-20 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                </svg>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Products Available</h3>
                <p className="text-gray-500 text-sm">Check back soon for exciting products!</p>
              </div>
            )}

          </main>

            {/* Right Sidebar - Hidden on mobile */}
            <aside className="hidden lg:block lg:w-64 flex-shrink-0">
              <RightSidebar stats={stats} />
            </aside>

          </div>
        </div>
      </div>

      {/* Mobile Floating Action Buttons - Only visible on mobile */}
      <div className="fixed bottom-4 right-4 lg:hidden flex flex-col gap-3 z-40">
        {/* Categories Button */}
        <button
          onClick={() => setShowCategoriesModal(true)}
          className="bg-orange-600 text-white p-4 rounded-full shadow-lg hover:bg-orange-700 transition-all hover:scale-110"
          aria-label="View Categories"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Help Button */}
        <button
          onClick={() => setShowHelpModal(true)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110"
          aria-label="Get Help"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* Categories Modal - Mobile */}
      {showCategoriesModal && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setShowCategoriesModal(false)}>
          <div
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Categories</h3>
              <button
                onClick={() => setShowCategoriesModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <LeftSidebar categories={categories} />
            </div>
          </div>
        </div>
      )}

      {/* Help Modal - Mobile */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setShowHelpModal(false)}>
          <div
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Help & Support</h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <RightSidebar stats={stats} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
