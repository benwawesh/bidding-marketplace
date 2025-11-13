import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auctionsAPI, cartAPI } from '../api/endpoints';
import { formatCurrency } from '../utils/helpers';
import { toast } from 'react-hot-toast';
import { useState } from 'react';
import { useAudio } from '../hooks/useAudio';

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

  // Initialize audio for background music (if product has music)
  const {
    isPlaying,
    toggle: toggleMusic,
    setVolume,
    currentVolume,
    isMuted,
    toggleMute,
  } = useAudio(product?.background_music_url || product?.background_music || null, {
    autoPlay: true,
    loop: true,
    volume: 0.3,
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

  // Build images array: main_image first, then additional images
  const images = [];
  if (product.main_image) {
    images.push(product.main_image);
  }
  if (product.images && product.images.length > 0) {
    product.images.forEach(img => {
      if (img.image_url) {
        images.push(img.image_url);
      }
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4 flex items-center justify-center" style={{ minHeight: '400px' }}>
              {images[selectedImage] ? (
                <img
                  src={images[selectedImage]}
                  alt={product.title}
                  className="w-full h-full object-contain max-h-[500px]"
                />
              ) : (
                <div className="w-full h-96 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-gray-500 text-6xl">📦</span>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery - Jumia Style */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`border-2 rounded-lg overflow-hidden transition-all duration-200 hover:border-orange-400 ${
                      selectedImage === idx ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-300'
                    }`}
                  >
                    <img src={img} alt={`View ${idx + 1}`} className="w-full h-20 object-contain bg-white p-1" />
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

      {/* Floating Music Player */}
      {product?.background_music && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-white rounded-full shadow-2xl border-2 border-orange-500 p-3 flex items-center gap-3">

            {/* Play/Pause Button */}
            <button
              onClick={toggleMusic}
              className="bg-gradient-to-r from-orange-500 to-rose-500 text-white w-12 h-12 rounded-full flex items-center justify-center hover:from-orange-600 hover:to-rose-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Music Icon with Animation */}
            <div className="flex items-center gap-2">
              {isPlaying ? (
                <div className="flex gap-1 items-end h-6">
                  <div className="w-1 bg-gradient-to-t from-orange-500 to-rose-500 rounded-full animate-music-bar-1" style={{ animationDelay: '0s' }}></div>
                  <div className="w-1 bg-gradient-to-t from-orange-500 to-rose-500 rounded-full animate-music-bar-2" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 bg-gradient-to-t from-orange-500 to-rose-500 rounded-full animate-music-bar-3" style={{ animationDelay: '0.4s' }}></div>
                  <div className="w-1 bg-gradient-to-t from-orange-500 to-rose-500 rounded-full animate-music-bar-4" style={{ animationDelay: '0.6s' }}></div>
                </div>
              ) : (
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              )}
              <span className="text-sm font-semibold text-gray-700 hidden sm:block">Background Music</span>
            </div>

            {/* Volume Control */}
            <div className="hidden md:flex items-center gap-2 ml-2">
              <button
                onClick={toggleMute}
                className="text-gray-600 hover:text-orange-600 transition-colors"
              >
                {isMuted ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : currentVolume * 100}
                onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
                className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
