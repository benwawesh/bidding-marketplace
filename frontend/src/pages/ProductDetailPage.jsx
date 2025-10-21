import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auctionsAPI, cartAPI } from '../api/endpoints';
import { formatCurrency } from '../utils/helpers';
import { toast } from 'react-hot-toast';
import { useState } from 'react';

export default function ProductDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  // Fetch product data
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => auctionsAPI.getById(id).then(res => res.data),
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: (data) => cartAPI.addToCart(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      toast.success('✅ Added to cart successfully!');
      setQuantity(1);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add to cart');
    },
  });

  const handleAddToCart = () => {
    if (!product) return;
    addToCartMutation.mutate({
      product_id: product.id,
      quantity: quantity,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-4">This product doesn't exist or has been removed.</p>
          <Link to="/" className="text-orange-600 hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  // Redirect to auction page if it's an auction product
  if (product.product_type === 'auction' || product.product_type === 'both') {
    window.location.href = `/auction/${id}`;
    return null;
  }

  const images = product.main_image ? [product.main_image] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-orange-600">BidMarket</Link>
          <nav className="flex items-center gap-6">
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
            <span className="text-gray-900">{product.title}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left: Image Gallery */}
          <div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
              {images[selectedImage] ? (
                <img 
                  src={images[selectedImage]} 
                  alt={product.title}
                  className="w-full h-96 object-cover"
                />
              ) : (
                <div className="w-full h-96 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-gray-500 text-6xl">📦</span>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`border-2 rounded overflow-hidden ${
                      selectedImage === idx ? 'border-orange-500' : 'border-gray-200'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-20 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              
              {/* Title & Category */}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
              {product.category_name && (
                <Link 
                  to={`/category/${product.category_name.toLowerCase()}`}
                  className="text-sm text-orange-600 hover:underline"
                >
                  {product.category_name}
                </Link>
              )}

              {/* Badge */}
              <div className="mt-4">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  🛒 Buy Now
                </span>
                {product.stock_quantity < 5 && product.stock_quantity > 0 && (
                  <span className="ml-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                    🔥 Only {product.stock_quantity} Left
                  </span>
                )}
              </div>

              <hr className="my-6" />

              {/* Price */}
              <div className="mb-6">
                <div className="text-sm text-gray-600 mb-1">Price</div>
                <div className="text-4xl font-bold text-blue-600">
                  {formatCurrency(product.buy_now_price)}
                </div>
                {product.stock_quantity > 0 ? (
                  <div className="text-sm text-green-600 mt-2">✓ In Stock ({product.stock_quantity} available)</div>
                ) : (
                  <div className="text-sm text-red-600 mt-2">✗ Out of Stock</div>
                )}
              </div>

              {/* Quantity Selector */}
              {product.stock_quantity > 0 && (
                <div className="mb-6">
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Quantity</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={product.stock_quantity}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock_quantity, parseInt(e.target.value) || 1)))}
                      className="w-20 text-center border-2 border-gray-300 rounded-lg font-semibold"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                      className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              {product.stock_quantity > 0 ? (
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-all shadow-lg"
                >
                  🛒 Add to Cart
                </button>
              ) : (
                <button
                  disabled
                  className="w-full bg-gray-300 text-gray-600 py-4 rounded-lg font-bold text-lg cursor-not-allowed"
                >
                  Out of Stock
                </button>
              )}

              <hr className="my-6" />

              {/* Product Details */}
              <div>
                <h3 className="font-bold text-lg mb-3">Product Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium capitalize">{product.status}</span>
                  </div>
                  {product.units_sold > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Units Sold:</span>
                      <span className="font-medium">{product.units_sold}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        {product.description && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-bold text-xl mb-4">Description</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{product.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
