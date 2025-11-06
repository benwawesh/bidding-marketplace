import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { cartAPI, ordersAPI, mpesaAPI } from '../api/endpoints';
import { formatCurrency } from '../utils/helpers';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Details, 2: Payment
  const [phoneNumber, setPhoneNumber] = useState('');

  const [deliveryInfo, setDeliveryInfo] = useState({
    shipping_name: '',
    shipping_address: '',
    shipping_city: '',
    shipping_phone: '',
    customer_notes: ''
  });

  // Fetch cart data
  const { data: cart, isLoading: cartLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartAPI.getCart,
  });

  const cartItems = cart?.data?.items || [];
  const subtotal = cart?.data?.subtotal || 0;
  const total = subtotal; // No shipping fee

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: (orderData) => ordersAPI.create(orderData),
    onSuccess: (response) => {
      const orderId = response.data.id;
      toast.success('Order created successfully!');
      // Move to payment step
      setStep(2);
      // Store order ID for payment
      window.sessionStorage.setItem('pending_order_id', orderId);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create order');
    },
  });

  // M-Pesa payment mutation
  const paymentMutation = useMutation({
    mutationFn: ({ orderId, phone }) =>
      mpesaAPI.initiateOrderPayment(orderId, phone),
    onSuccess: () => {
      const orderId = window.sessionStorage.getItem('pending_order_id');
      toast.success('Payment request sent! Check your phone for M-Pesa prompt');
      // Redirect to payment status page
      navigate(`/payment-status?order_id=${orderId}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Payment failed');
    },
  });

  const handleSubmitDetails = (e) => {
    e.preventDefault();

    // Validate delivery info
    if (!deliveryInfo.shipping_name || !deliveryInfo.shipping_address || !deliveryInfo.shipping_city || !deliveryInfo.shipping_phone) {
      toast.error('Please fill in all delivery details');
      return;
    }

    // Create order with delivery info
    createOrderMutation.mutate(deliveryInfo);
  };

  const handleSubmitPayment = (e) => {
    e.preventDefault();

    const orderId = window.sessionStorage.getItem('pending_order_id');
    if (!orderId) {
      toast.error('No order found. Please try again.');
      setStep(1);
      return;
    }

    // Validate phone number (Kenyan format: 254XXXXXXXXX or 07XXXXXXXX)
    const cleanPhone = phoneNumber.replace(/\s/g, '');
    if (!/^(254|07|7)\d{8,9}$/.test(cleanPhone)) {
      toast.error('Please enter a valid Kenyan phone number (e.g., 0712345678 or 254712345678)');
      return;
    }

    // Format phone number to 254XXXXXXXXX
    let formattedPhone = cleanPhone;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('7')) {
      formattedPhone = '254' + formattedPhone;
    }

    paymentMutation.mutate({ orderId, phone: formattedPhone });
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-4">Add items to your cart before checking out.</p>
          <Link to="/browse" className="text-orange-600 hover:underline">← Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-orange-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="font-medium">Delivery Details</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-orange-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="font-medium">Payment</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 1 ? (
              /* Step 1: Delivery Details */
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Information</h2>
                <form onSubmit={handleSubmitDetails} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={deliveryInfo.shipping_name}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, shipping_name: e.target.value })}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Delivery Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={deliveryInfo.shipping_address}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, shipping_address: e.target.value })}
                      placeholder="Enter your delivery address"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={deliveryInfo.shipping_city}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, shipping_city: e.target.value })}
                      placeholder="Enter your city"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={deliveryInfo.shipping_phone}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, shipping_phone: e.target.value })}
                      placeholder="0712345678"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Delivery Notes (Optional)
                    </label>
                    <textarea
                      value={deliveryInfo.customer_notes}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, customer_notes: e.target.value })}
                      placeholder="Any special instructions for delivery"
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={createOrderMutation.isPending}
                    className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition disabled:opacity-50"
                  >
                    {createOrderMutation.isPending ? 'Processing...' : 'Continue to Payment'}
                  </button>
                </form>
              </div>
            ) : (
              /* Step 2: Payment */
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Payment via M-Pesa</h2>
                <p className="text-gray-600 mb-6">
                  Enter your M-Pesa phone number to complete the payment. You will receive a prompt on your phone.
                </p>

                <form onSubmit={handleSubmitPayment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      M-Pesa Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="0712345678 or 254712345678"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: 0712345678 or 254712345678
                    </p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="text-sm text-green-800">
                        <p className="font-semibold mb-1">How M-Pesa Payment Works:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Enter your M-Pesa phone number</li>
                          <li>Click "Pay Now"</li>
                          <li>Check your phone for the M-Pesa prompt</li>
                          <li>Enter your M-Pesa PIN to complete payment</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={paymentMutation.isPending}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {paymentMutation.isPending ? 'Processing...' : '💳 Pay Now'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

              {/* Cart Items */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 pb-3 border-b border-gray-200">
                    <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                      {item.product_image ? (
                        <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">📦</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-gray-900 truncate">{item.product_name}</h4>
                      <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.subtotal)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
                  <span>Total</span>
                  <span className="text-orange-600">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
