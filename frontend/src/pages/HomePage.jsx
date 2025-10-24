import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auctionsAPI, categoriesAPI, cartAPI } from '../api/endpoints';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import HeroAuctionSection from '../components/sections/HeroAuctionSection';
import HorizontalCarousel from '../components/carousels/HorizontalCarousel';
import CategoriesGrid from '../components/sections/CategoriesGrid';
import BuyNowCard from '../components/cards/BuyNowCard';
import BothCard from '../components/cards/BothCard';
import PromoBar from '../components/layout/PromoBar';
import Navbar from '../components/layout/Navbar';
import { Link } from "react-router-dom";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Fetch data
  const { data: auctions = [], isLoading: auctionsLoading } = useQuery({
    queryKey: ['auctions'],
    queryFn: () => auctionsAPI.getAll().then(res => res.data),
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
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="skeleton w-20 h-20 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading BidMarket...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-rose-100">
      <PromoBar />
      <Navbar />

      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          🎯 <strong>HYBRID MARKETPLACE:</strong> Buy Instantly OR Bid to Save up to 70% | 
          <a href="#browse" className="underline font-bold ml-1">EXPLORE NOW</a>
        </div>
      </div>

      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <form className="flex gap-2">
            <input
              type="text"
              placeholder="Search products, brands and categories"
              className="flex-1 px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-orange-500"
            />
            <button 
              type="submit" 
              className="bg-orange-500 text-white px-8 py-3 rounded font-semibold hover:bg-orange-600 transition uppercase"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 py-4">
        <div className="flex gap-4">
          
          <LeftSidebar categories={categories} />

          <main className="flex-1 min-w-0">
            
            {/* HERO SECTION - SINGLE LIVE AUCTION with FIREWORKS */}
            <HeroAuctionSection auction={heroAuction} />

            {/* Categories Grid */}
            <CategoriesGrid categories={categories} />

            {/* Buy Now Section */}
            {buyNowProducts.length > 0 && (
              <section id="buy-now" className="my-8 relative">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-orange-600">Buy Now - Instant Purchase</h2>
                <Link
                  to="/buy-now"
                  className="text-sm text-orange-500 hover:underline"
                >
                  View All
                </Link>
                </div>

                {/* Slider Container */}
                <div className="relative">
                  {/* Left Arrow */}
                  <button
                    id="scrollLeft"
                    onClick={() => document.getElementById('buyNowSlider').scrollBy({ left: -400, behavior: 'smooth' })}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full shadow hover:bg-orange-100 p-2 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Cards Slider */}
                  <div
                    id="buyNowSlider"
                    className="flex gap-4 overflow-x-hidden scroll-smooth"
                  >
                    {buyNowProducts.map((product) => (
                      <div
                        key={product.id}
                        className="w-[calc(20%-0.8rem)] flex-shrink-0 transform transition-transform duration-300 hover:scale-105 hover:shadow-lg"
                      >
                        <BuyNowCard
                          product={product}
                          onAddToCart={handleAddToCart}
                          isAddingToCart={addToCartMutation.isPending}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Right Arrow */}
                  <button
                    id="scrollRight"
                    onClick={() => document.getElementById('buyNowSlider').scrollBy({ left: 400, behavior: 'smooth' })}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full shadow hover:bg-orange-100 p-2 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </section>
            )}



            {/* Both Options Section */}
            {bothProducts.length > 0 && (
              <HorizontalCarousel 
                title="Both Options - You Decide" 
                titleColor="purple"
                viewAllLink="#both"
              >
                {bothProducts.map(product => (
                  <BothCard 
                    key={product.id} 
                    product={product}
                    onAddToCart={handleAddToCart}
                    isAddingToCart={addToCartMutation.isPending}
                  />
                ))}
              </HorizontalCarousel>
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

          <RightSidebar stats={stats} />

        </div>
      </div>
    </div>
  );
}
