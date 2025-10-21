import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { auctionsAPI } from '../api/endpoints';
import BuyNowCard from '../components/cards/BuyNowCard';
import AuctionCard from '../components/cards/AuctionCard';
import BothCard from '../components/cards/BothCard';

export default function CategoryPage() {
  const { slug } = useParams();
  
  const { data: auctions = [], isLoading } = useQuery({
    queryKey: ['auctions'],
    queryFn: () => auctionsAPI.getAll().then(res => res.data),
  });

  // Filter by category (case-insensitive match)
  const categoryProducts = auctions.filter(
    p => p.status === 'active' && 
    p.category_name?.toLowerCase() === slug.toLowerCase()
  );

  const categoryName = categoryProducts[0]?.category_name || slug;

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-orange-600">BidMarket</Link>
          <nav className="flex items-center gap-6">
            <Link to="/" className="text-gray-700 hover:text-orange-600">Home</Link>
            <Link to="/browse" className="text-gray-700 hover:text-orange-600">Browse</Link>
            <Link to="/cart" className="text-gray-700 hover:text-orange-600">Cart</Link>
          </nav>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-orange-600">Home</Link>
            <span>›</span>
            <Link to="/browse" className="hover:text-orange-600">Browse</Link>
            <span>›</span>
            <span className="text-gray-900 capitalize">{categoryName}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Category Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 capitalize">{categoryName}</h1>
          <p className="text-gray-600">
            {categoryProducts.length} {categoryProducts.length === 1 ? 'product' : 'products'} available
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="skeleton w-20 h-20 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && categoryProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categoryProducts.map(product => renderCard(product))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && categoryProducts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <svg className="mx-auto h-20 w-20 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
            </svg>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Products in This Category</h3>
            <p className="text-gray-500 text-sm mb-4">Check back soon or browse other categories</p>
            <Link to="/browse" className="text-orange-600 hover:underline">
              ← Browse All Products
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}