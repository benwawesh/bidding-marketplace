import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { cartAPI } from '../api/endpoints';
import { formatCurrency } from '../utils/helpers';

export default function CartPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch cart data from backend
  const { data: cart, isLoading, error } = useQuery({
    queryKey: ['cart'],
    queryFn: cartAPI.getCart,
  });

  // Update quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: ({ product_id, quantity }) => 
      cartAPI.updateQuantity({ product_id, quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      toast.success('Quantity updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update quantity');
    },
  });

  // Remove item mutation  
  const removeItemMutation = useMutation({
    mutationFn: (itemId) => cartAPI.removeItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      toast.success('Item removed from cart');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to remove item');
    },
  });

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: cartAPI.clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      toast.success('Cart cleared');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to clear cart');
    },
  });

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantityMutation.mutate({ product_id: productId, quantity: newQuantity });
  };

  const removeItem = (itemId) => {
    if (confirm('Remove this item from cart?')) {
      removeItemMutation.mutate(itemId);
    }
  };

  const clearCart = () => {
    if (confirm('Clear all items from cart?')) {
      clearCartMutation.mutate();
    }
  };

  // Calculate totals
  const cartItems = cart?.data?.items || [];
  const subtotal = cart?.data?.subtotal || 0;
  const totalItems = cart?.data?.total_items || 0;
  const total = subtotal; // No shipping fee

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load cart</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              disabled={clearCartMutation.isPending}
              className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
            >
              {clearCartMutation.isPending ? 'Clearing...' : 'Clear Cart'}
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart */
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="mx-auto h-24 w-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Start shopping to add items to your cart!</p>
            <Link 
              to="/browse" 
              className="inline-block bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          /* Cart with Items */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm">
                {cartItems.map((item, index) => (
                  <div 
                    key={item.id}
                    className={`p-6 flex gap-4 ${index !== cartItems.length - 1 ? 'border-b' : ''}`}
                  >
                    {/* Product Image */}
                    <div className="w-24 h-24 flex-shrink-0">
                      {item.product.main_image ? (
                        <img 
                          src={item.product.main_image} 
                          alt={item.product.title}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <Link 
                        to={`/product/${item.product.id}`}
                        className="text-lg font-semibold text-gray-900 hover:text-orange-600"
                      >
                        {item.product.title}
                      </Link>
                      <p className="text-gray-600 text-sm mt-1">
                        {formatCurrency(item.price)} each
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        In stock: {item.product.stock_quantity}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 mt-3">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || updateQuantityMutation.isPending}
                          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          −
                        </button>
                        <span className="text-gray-900 font-medium w-12 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock_quantity || updateQuantityMutation.isPending}
                          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={removeItemMutation.isPending}
                          className="ml-auto text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                        >
                          {removeItemMutation.isPending ? 'Removing...' : 'Remove'}
                        </button>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">
                        {formatCurrency(item.total_price)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                <button
                  className="w-full bg-orange-500 text-white py-4 rounded-lg font-bold hover:bg-orange-600 transition mb-3"
                  onClick={() => navigate('/checkout')}
                >
                  Proceed to Checkout
                </button>

                <Link 
                  to="/browse"
                  className="block text-center text-orange-600 hover:underline text-sm"
                >
                  Continue Shopping
                </Link>

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t">
                  <div className="text-xs text-gray-600 space-y-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                      <span>Secure Checkout</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                      <span>Free Returns</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                      <span>24/7 Support</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}