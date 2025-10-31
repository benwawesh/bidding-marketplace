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
import { Link } from "react-router-dom";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const queryClient
  
  
  = useQueryClient();

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
      {/* Enhanced Search Bar */}
      <div className="bg-gradient-to-r from-rose-50 via-orange-50 to-rose-50 shadow-md w-full border-b border-rose-100">
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
                className="flex-1 pl-12 pr-4 py-3 sm:py-4 text-sm sm:text-base bg-white border-2 border-gray-200 rounded-full focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-300 shadow-sm hover:shadow-md"
              />

              <button
                type="submit"
                className="absolute right-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-full font-semibold hover:from-orange-600 hover:to-rose-600 transition-all duration-300 text-sm sm:text-base shadow-md hover:shadow-lg transform hover:scale-105"
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

            {/* Buy Now Section - Enhanced Design */}
            {buyNowProducts.length > 0 && (
              <section id="buy-now" className="my-6 sm:my-8 md:my-10">
                <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 border-b-2 border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-orange-500 to-rose-500 p-2 rounded-lg shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
                      Buy Now
                    </h2>
                  </div>
                  <Link
                    to="/buy-now"
                    className="group flex items-center gap-2 text-xs sm:text-sm text-orange-600 hover:text-rose-600 font-semibold transition-all duration-300"
                  >
                    <span>View All</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

                {/* Mobile: Simple Grid, Desktop: Scrollable */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
                  {buyNowProducts.map((product) => (
                    <div key={product.id} className="w-full">
                      <BuyNowCard
                        product={product}
                        onAddToCart={handleAddToCart}
                        isAddingToCart={addToCartMutation.isPending}
                      />
                    </div>
                  ))}
                </div>
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

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
                  {bothProducts.map(product => (
                    <div key={product.id} className="w-full">
                      <BothCard
                        product={product}
                        onAddToCart={handleAddToCart}
                        isAddingToCart={addToCartMutation.isPending}
                      />
                    </div>
                  ))}
                </div>
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
    </div>
  );
}
