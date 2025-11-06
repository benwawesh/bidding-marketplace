import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { mpesaAPI } from '../api/endpoints';
import { formatCurrency } from '../utils/helpers';

export default function PaymentStatusPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [pollingCount, setPollingCount] = useState(0);

  // Poll payment status every 3 seconds
  const { data: paymentStatus, isLoading } = useQuery({
    queryKey: ['payment-status', orderId],
    queryFn: () => mpesaAPI.checkOrderPaymentStatus(orderId),
    enabled: !!orderId,
    refetchInterval: (data) => {
      // Stop polling if payment is completed or failed, or after 40 polls (2 minutes)
      if (!data || pollingCount >= 40) return false;
      const status = data?.data?.payment_status;
      if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        return false;
      }
      return 3000; // Poll every 3 seconds
    },
    onSuccess: (data) => {
      setPollingCount(prev => prev + 1);
      const status = data?.data?.payment_status;

      // Redirect after successful payment
      if (status === 'completed') {
        setTimeout(() => {
          navigate(`/order-confirmation?order_id=${orderId}`);
        }, 2000);
      }
    }
  });

  useEffect(() => {
    if (!orderId) {
      navigate('/');
    }
  }, [orderId, navigate]);

  const status = paymentStatus?.data?.payment_status;
  const orderStatus = paymentStatus?.data?.order_status;
  const totalAmount = paymentStatus?.data?.total_amount;
  const message = paymentStatus?.data?.message;

  if (isLoading && !status) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Status Icon */}
          <div className="text-center mb-6">
            {status === 'pending' && (
              <div className="inline-block">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto mb-4"></div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}

            {status === 'completed' && (
              <div className="inline-block">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>
            )}

            {(status === 'failed' || status === 'cancelled') && (
              <div className="inline-block">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Status Message */}
          <div className="text-center mb-6">
            {status === 'pending' && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Processing</h2>
                <p className="text-gray-600 mb-4">
                  Please check your phone for the M-Pesa prompt and enter your PIN to complete the payment.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <p className="text-sm font-semibold text-blue-900 mb-2">What to do next:</p>
                  <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
                    <li>Check your phone for the M-Pesa STK push notification</li>
                    <li>Enter your M-Pesa PIN to authorize the payment</li>
                    <li>Wait for confirmation (this page will update automatically)</li>
                  </ol>
                </div>
                {totalAmount && (
                  <div className="mt-4 text-lg">
                    <span className="text-gray-600">Amount: </span>
                    <span className="font-bold text-orange-600">{formatCurrency(totalAmount)}</span>
                  </div>
                )}
              </>
            )}

            {status === 'completed' && (
              <>
                <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
                <p className="text-gray-600 mb-4">
                  Your payment has been received and your order is being processed.
                </p>
                {totalAmount && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="text-lg">
                      <span className="text-gray-600">Amount Paid: </span>
                      <span className="font-bold text-green-600">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                )}
                <p className="text-sm text-gray-500">Redirecting to your orders...</p>
              </>
            )}

            {(status === 'failed' || status === 'cancelled') && (
              <>
                <h2 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h2>
                <p className="text-gray-600 mb-4">{message || 'The payment could not be completed.'}</p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-800">
                    {status === 'cancelled'
                      ? 'You cancelled the M-Pesa payment prompt.'
                      : 'The payment was not successful. Please try again.'}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            {status === 'pending' && (
              <button
                onClick={() => navigate('/profile')}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Continue Shopping
              </button>
            )}

            {(status === 'failed' || status === 'cancelled') && (
              <>
                <button
                  onClick={() => navigate('/checkout')}
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  View Orders
                </button>
              </>
            )}

            {status === 'completed' && (
              <button
                onClick={() => navigate(`/order-confirmation?order_id=${orderId}`)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
              >
                View Order Details
              </button>
            )}
          </div>

          {/* Polling indicator */}
          {status === 'pending' && (
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Checking payment status... ({pollingCount} checks)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
