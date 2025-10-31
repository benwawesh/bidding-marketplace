import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { auctionsAPI, categoriesAPI } from '../api/endpoints';
import BuyNowCard from '../components/cards/BuyNowCard';
import AuctionCard from '../components/cards/AuctionCard';
import BothCard from '../components/cards/BothCard';

export default function BrowsePage() {
  const [filter, setFilter] = useState('all'); // all, buy_now, auction, both
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // newest, price_low, price_high

  // Fetch data
  const { data: auctions = [], isLoading: auctionsLoading } = useQuery({
    queryKey: ['auctions'],
    queryFn: () => auctionsAPI.getAll().then(res => res.data?.results || res.data || []),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll().then(res => res.data?.results || res.data || []),
  });

  // Filter products
  let filteredProducts = auctions.filter(p => p.status === 'active');

  // Filter by type
  if (filter !== 'all') {
    if (filter === 'buy_now') {
      filteredProducts = filteredProducts.filter(p => p.product_type === 'buy_now' || p.product_type === 'both');
    } else if (filter === 'auction') {
      filteredProducts = filteredProducts.filter(p => p.product_type === 'auction' || p.product_type === 'both');
    } else {
      filteredProducts = filteredProducts.filter(p => p.product_type === filter);
    }
  }

  // Filter by category
  if (selectedCategory !== 'all') {
    filteredProducts = filteredProducts.filter(p => p.category_name === selectedCategory);
  }

  // Sort products
  if (sortBy === 'price_low') {
    filteredProducts.sort((a, b) => {
      const priceA = a.buy_now_price || a.base_price || 0;
      const priceB = b.buy_now_price || b.base_price || 0;
      return priceA - priceB;
    });
  } else if (sortBy === 'price_high') {
    filteredProducts.sort((a, b) => {
      const priceA = a.buy_now_price || a.base_price || 0;
      const priceB = b.buy_now_price || b.base_price || 0;
      return priceB - priceA;
    });
  }

  const handleAddToCart = (productId, title) => {
    alert(`✅ ${title} added to cart!`);
  };

  const renderCard = (product) => {
    if (product.product_type === 'buy_now') {
      return <BuyNowCard key={product.id} product={product} onAddToCart={handleAddToCart} />;
    } else if (product.product_type === 'auction') {
      return <AuctionCard key={product.id} product={product} />;
    } else {
      return <BothCard key={product.id} product={product} />;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Search Bar - Mobile Responsive */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <form className="flex gap-2">
            <input
              type="text"
              placeholder="Search products..."
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              className="bg-orange-500 text-white px-4 sm:px-8 py-2 sm:py-3 rounded font-semibold hover:bg-orange-600 transition text-sm sm:text-base uppercase"
            >
              <span className="hidden sm:inline">Search</span>
              <span className="sm:hidden">🔍</span>
            </button>
          </form>
        </div>
      </div>

      {/* Main Content - Mobile Responsive */}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 md:py-8">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">

          {/* Sidebar Filters - Hidden on mobile, show on large screens */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              
              {/* Product Type Filter */}
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3">Product Type</h3>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All Products' },
                    { value: 'buy_now', label: 'Buy Now' },
                    { value: 'auction', label: 'Auctions' },
                    { value: 'both', label: 'Both Options' },
                  ].map(option => (
                    <label key={option.value} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="filter"
                        value={option.value}
                        checked={filter === option.value}
                        onChange={(e) => setFilter(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3">Category</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value="all"
                      checked={selectedCategory === 'all'}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">All Categories</span>
                  </label>
                  {categories.map(cat => (
                    <label key={cat.id} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        value={cat.name}
                        checked={selectedCategory === cat.name}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div>
                <h3 className="font-bold text-lg mb-3">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-orange-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>

            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">

            {/* Results Header - Mobile Responsive */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Browse Products
                <span className="text-sm sm:text-lg font-normal text-gray-600 ml-2">
                  ({filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'})
                </span>
              </h1>

              {/* Mobile Filter Toggle Button - Only show on mobile */}
              <button className="lg:hidden bg-orange-500 text-white px-4 py-2 rounded font-semibold text-sm">
                🔍 Filters
              </button>
            </div>

            {/* Loading State */}
            {auctionsLoading && (
              <div className="text-center py-12">
                <div className="skeleton w-20 h-20 rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading products...</p>
              </div>
            )}

            {/* Products Grid - Mobile Responsive */}
            {!auctionsLoading && filteredProducts.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                {filteredProducts.map(product => renderCard(product))}
              </div>
            )}

            {/* Empty State */}
            {!auctionsLoading && filteredProducts.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <svg className="mx-auto h-20 w-20 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Products Found</h3>
                <p className="text-gray-500 text-sm mb-4">Try adjusting your filters</p>
                <button
                  onClick={() => {
                    setFilter('all');
                    setSelectedCategory('all');
                  }}
                  className="text-orange-600 hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}