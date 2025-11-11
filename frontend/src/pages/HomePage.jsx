import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auctionsAPI, categoriesAPI, cartAPI } from '../api/endpoints';
import { getRounds } from '../api/bidAPI';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import HeroAuctionSection from '../components/sections/HeroAuctionSection';
import HeroImageCarousel from '../components/carousels/HeroImageCarousel';
import CategoriesGrid from '../components/sections/CategoriesGrid';
import BuyNowCard from '../components/cards/BuyNowCard';
import BothCard from '../components/cards/BothCard';
import ProductCarousel from '../components/carousel/ProductCarousel';
import { Link } from "react-router-dom";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [activeHelpTopic, setActiveHelpTopic] = useState(null);

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

  // Filter products by type
  // Hero: Show FIRST active auction only
  const liveAuctions = auctions.filter(p =>
    (p.product_type === 'auction' || p.product_type === 'both') &&
    p.status === 'active'
  );
  const heroAuction = liveAuctions[0] || null; // Get first active auction

  // Fetch rounds for hero auction to check if it has active rounds
  const { data: heroRounds = [] } = useQuery({
    queryKey: ['hero-rounds', heroAuction?.id],
    queryFn: () => getRounds(heroAuction.id),
    enabled: !!heroAuction,
  });

  // Check if hero auction has active rounds
  const hasActiveRound = heroRounds.some(r => r.is_active);
  const showImageCarousel = !heroAuction || !hasActiveRound;

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

  // Help Modal Content
  const helpModals = {
    'help-center': {
      title: 'Help Center',
      icon: '📚',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">Welcome to BidSoko Help Center!</p>
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">Getting Started</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Create a free account to start buying and bidding</li>
              <li>Browse our wide range of products</li>
              <li>Choose to buy instantly or bid to save up to 70%</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">Need More Help?</h4>
            <p className="text-sm text-gray-600">Call us at <a href="tel:0711011011" className="text-orange-600 font-semibold">0711 011 011</a></p>
            <p className="text-sm text-gray-600">Email: <a href="mailto:support@bidsoko.com" className="text-orange-600">support@bidsoko.com</a></p>
          </div>
        </div>
      )
    },
    'how-to-buy': {
      title: 'How to Buy',
      icon: '🛒',
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
              <div>
                <h4 className="font-semibold text-gray-900">Browse Products</h4>
                <p className="text-sm text-gray-600">Find products marked with "Buy Now" option</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
              <div>
                <h4 className="font-semibold text-gray-900">Add to Cart</h4>
                <p className="text-sm text-gray-600">Click "Add to Cart" or "Buy Now" button</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
              <div>
                <h4 className="font-semibold text-gray-900">Checkout</h4>
                <p className="text-sm text-gray-600">Enter delivery details and make payment via M-Pesa</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
              <div>
                <h4 className="font-semibold text-gray-900">Get Your Order</h4>
                <p className="text-sm text-gray-600">We'll deliver to your doorstep!</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    'how-to-bid': {
      title: 'How to Bid',
      icon: '🎯',
      content: (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800 font-medium">Save up to 70% by bidding instead of buying!</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
              <div>
                <h4 className="font-semibold text-gray-900">Find Auction Products</h4>
                <p className="text-sm text-gray-600">Look for products marked with "Auction" or "Both"</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
              <div>
                <h4 className="font-semibold text-gray-900">Pay Participation Fee</h4>
                <p className="text-sm text-gray-600">Small fee to join the auction (varies by product)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
              <div>
                <h4 className="font-semibold text-gray-900">Place Your Bids</h4>
                <p className="text-sm text-gray-600">Bid higher than current highest bid to stay in the lead</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
              <div>
                <h4 className="font-semibold text-gray-900">Win & Pay</h4>
                <p className="text-sm text-gray-600">If you win, pay your final bid amount to get the product!</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    'payment-options': {
      title: 'Payment Options',
      icon: '💳',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">We currently accept the following payment method:</p>
          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-green-600 text-white rounded-lg flex items-center justify-center text-2xl">📱</div>
              <div>
                <h4 className="font-semibold text-gray-900">M-Pesa STK Push</h4>
                <p className="text-sm text-gray-600">Instant & Secure</p>
              </div>
            </div>
            <ul className="text-sm text-gray-600 space-y-1 ml-15">
              <li>✓ Direct M-Pesa payment</li>
              <li>✓ You'll receive an STK push on your phone</li>
              <li>✓ Enter your M-Pesa PIN to complete</li>
              <li>✓ Instant confirmation</li>
            </ul>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">💡 <strong>Tip:</strong> Make sure you have sufficient M-Pesa balance before checkout</p>
          </div>
        </div>
      )
    },
    'track-delivery': {
      title: 'Track Delivery',
      icon: '🚚',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">Track your order status anytime:</p>
          <div className="space-y-3">
            <div className="border-l-4 border-yellow-500 pl-4 py-2">
              <h4 className="font-semibold text-gray-900">Pending</h4>
              <p className="text-sm text-gray-600">Order received, payment being processed</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h4 className="font-semibold text-gray-900">Processing</h4>
              <p className="text-sm text-gray-600">Order confirmed, being prepared for shipment</p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <h4 className="font-semibold text-gray-900">Shipped</h4>
              <p className="text-sm text-gray-600">On the way to your delivery address</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <h4 className="font-semibold text-gray-900">Delivered</h4>
              <p className="text-sm text-gray-600">Package successfully delivered!</p>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-sm text-gray-700"><strong>View your orders:</strong> Go to <span className="text-orange-600 font-semibold">Dashboard → Purchase History</span></p>
          </div>
        </div>
      )
    },
    'returns-refunds': {
      title: 'Returns & Refunds',
      icon: '↩️',
      content: (
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800 font-medium">We want you to be 100% satisfied with your purchase!</p>
          </div>
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Return Policy</h4>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>7-day return policy for most products</li>
                <li>Product must be unused and in original packaging</li>
                <li>Keep your receipt/order number</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Refund Process</h4>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Contact us at 0711 011 011</li>
                <li>Provide order number and reason for return</li>
                <li>Refund processed within 5-7 business days</li>
                <li>Money refunded via M-Pesa</li>
              </ul>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-sm text-gray-700"><strong>Questions?</strong> Contact support at <a href="mailto:support@bidsoko.com" className="text-orange-600">support@bidsoko.com</a></p>
          </div>
        </div>
      )
    }
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

            {/* HERO SECTION - Conditional Rendering */}
            {showImageCarousel ? (
              /* Show image carousel when no active auctions OR auctions have ended */
              <HeroImageCarousel />
            ) : (
              /* Show auction section when there's an active auction with active rounds */
              <HeroAuctionSection auction={heroAuction} />
            )}

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

      {/* Mobile Floating Action Button - Only visible on mobile */}
      <div className="fixed bottom-4 right-4 lg:hidden z-40">
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

      {/* Help Modal - Mobile */}
      {showHelpModal && !activeHelpTopic && (
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
            <div className="p-4 space-y-4">
              {/* Special Offers */}
              <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-lg shadow-lg p-4">
                <h3 className="text-base font-bold text-white mb-2 text-center">
                  🎉 Special Offers
                </h3>
                <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                  <p className="text-sm font-bold text-white">
                    Join the bid TODAY and get CRAZY OFFERS!
                  </p>
                </div>
              </div>

              {/* WhatsApp Support */}
              <div className="bg-green-500 text-white rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-3 mb-3">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <div>
                    <h3 className="font-bold text-base">WhatsApp</h3>
                    <p className="text-sm text-green-100">Quick support</p>
                  </div>
                </div>
                <a href="https://wa.me/254711011011" target="_blank" rel="noopener noreferrer" className="block w-full bg-white text-green-600 py-2 rounded font-semibold hover:bg-green-50 transition text-center">
                  CHAT NOW
                </a>
              </div>

              {/* Need Help Section */}
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-3">NEED HELP?</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <button onClick={() => setActiveHelpTopic('help-center')} className="text-blue-600 hover:underline text-left w-full">
                      📚 Help Center
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setActiveHelpTopic('how-to-buy')} className="text-blue-600 hover:underline text-left w-full">
                      🛒 How to Buy
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setActiveHelpTopic('how-to-bid')} className="text-blue-600 hover:underline text-left w-full">
                      🎯 How to Bid
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setActiveHelpTopic('payment-options')} className="text-blue-600 hover:underline text-left w-full">
                      💳 Payment Options
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setActiveHelpTopic('track-delivery')} className="text-blue-600 hover:underline text-left w-full">
                      🚚 Track Delivery
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setActiveHelpTopic('returns-refunds')} className="text-blue-600 hover:underline text-left w-full">
                      ↩️ Returns & Refunds
                    </button>
                  </li>
                </ul>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Call us:</p>
                  <a href="tel:0711011011" className="text-orange-600 font-bold text-lg hover:text-orange-700">
                    0711 011 011
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Topic Detail Modal - Mobile */}
      {activeHelpTopic && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setActiveHelpTopic(null)}>
          <div
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-3 flex items-center justify-between sticky top-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveHelpTopic(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-2xl">{helpModals[activeHelpTopic].icon}</span>
                <h3 className="text-lg font-bold">{helpModals[activeHelpTopic].title}</h3>
              </div>
              <button
                onClick={() => { setActiveHelpTopic(null); setShowHelpModal(false); }}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-64px)]">
              {helpModals[activeHelpTopic].content}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 flex justify-end border-t sticky bottom-0">
              <button
                onClick={() => setActiveHelpTopic(null)}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-700 transition"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
