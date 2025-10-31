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
  const queryClient = useQueryClient();

  // Fetch data with auto-refresh every 30 seconds
  const { data: auctions = [], isLoading: auctionsLoading } = useQuery({
    queryKey: ['auctions'],
    queryFn: () => auctionsAPI.getAll().then(res => res.data),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll().then(res => res.data),
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
      {/* Search Bar - Mobile Responsive */}
      <div className="bg-rose-50 shadow-sm w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <form className="flex gap-2">
            <input
              type="text"
              placeholder="Search products..."
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white border border-gray-300 rounded focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              className="bg-orange-500 text-white px-3 sm:px-8 py-2 sm:py-3 rounded font-semibold hover:bg-orange-600 transition text-sm sm:text-base"
            >
              <span className="hidden sm:inline">Search</span>
              <span className="sm:hidden text-lg">🔍</span>
            </button>
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

            {/* Buy Now Section - Mobile First */}
            {buyNowProducts.length > 0 && (
              <section id="buy-now" className="my-4 sm:my-6 md:my-8">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-orange-600">
                    Buy Now
                  </h2>
                  <Link
                    to="/buy-now"
                    className="text-xs sm:text-sm text-orange-500 hover:underline"
                  >
                    View All
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



            {/* Both Options Section - Mobile First */}
            {bothProducts.length > 0 && (
              <section className="my-4 sm:my-6 md:my-8">
                <div className="mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-purple-600">
                    Both Options - You Decide
                  </h2>
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
