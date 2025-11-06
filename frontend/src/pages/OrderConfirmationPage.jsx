import { useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ordersAPI } from '../api/endpoints';
import { formatCurrency } from '../utils/helpers';

export default function OrderConfirmationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');

  // Fetch order details
  const { data: orderData, isLoading, isError } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersAPI.getById(orderId),
    enabled: !!orderId,
  });

  useEffect(() => {
    if (!orderId) {
      navigate('/');
    }
  }, [orderId, navigate]);

  const order = orderData?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">We couldn't find this order.</p>
          <Link to="/" className="text-orange-600 hover:underline">Return to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Success Banner */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-8 text-center">
            <div className="inline-block w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Order Confirmed!</h1>
            <p className="text-green-50 text-lg">Thank you for your purchase</p>
          </div>

          {/* Order Summary Info */}
          <div className="px-6 py-6 border-b border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Order Number</p>
                <p className="text-lg font-bold text-gray-900">{order.order_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Order Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  order.payment_status === 'paid'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.payment_status === 'paid' ? 'Paid' : order.payment_status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(order.total_amount)}</p>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="px-6 py-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Delivery Information</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                <div>
                  <p className="font-semibold text-gray-900">{order.shipping_name}</p>
                  <p className="text-sm text-gray-600">{order.shipping_phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <div>
                  <p className="text-gray-900">{order.shipping_address}</p>
                  <p className="text-gray-600">{order.shipping_city}</p>
                </div>
              </div>
              {order.customer_notes && (
                <div className="flex items-start gap-2 pt-2 border-t border-gray-200">
                  <svg className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Delivery Notes:</p>
                    <p className="text-sm text-gray-600">{order.customer_notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="px-6 py-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Order Items</h3>
            <div className="space-y-3">
              {order.items && order.items.map((item) => (
                <div key={item.id} className="flex gap-4 pb-3 border-b border-gray-200 last:border-0">
                  <div className="w-20 h-20 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        📦
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{item.product_name}</h4>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(item.price)} each
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(item.subtotal)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Total */}
            <div className="mt-6 pt-4 border-t-2 border-gray-300">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-orange-600">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/profile?tab=orders"
            className="bg-orange-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-700 transition text-center"
          >
            View All Orders
          </Link>
          <Link
            to="/browse"
            className="bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition text-center"
          >
            Continue Shopping
          </Link>
        </div>

        {/* What's Next */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-3">What Happens Next?</h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600">1.</span>
              <span>We'll process your order and prepare it for shipping</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600">2.</span>
              <span>You'll receive email updates about your order status</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600">3.</span>
              <span>Track your order anytime from your profile page</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600">4.</span>
              <span>Delivery will be made to the address provided above</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
