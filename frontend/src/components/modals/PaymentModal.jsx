import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import authAxios from '../../api/authAxios';
import { formatCurrency } from '../../utils/helpers';
import { Smartphone, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentModal({ auctionId, roundId, amount, onSuccess, onClose }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState(null);
  const [countdown, setCountdown] = useState(120); // 2 minutes timeout
  const [paymentComplete, setPaymentComplete] = useState(false);

  // Poll payment status when we have a checkout request ID
  // Reduced polling to avoid M-Pesa API rate limits (429 errors)
  const { data: paymentStatus, refetch } = useQuery({
    queryKey: ['payment-status', auctionId],
    queryFn: () => authAxios.get(`/api/payments/status/${auctionId}/`).then(res => res.data),
    enabled: !!checkoutRequestId && isProcessing,
    refetchInterval: isProcessing ? 8000 : false, // Poll every 8 seconds (reduced from 3s)
  });

  // Initiate M-Pesa payment mutation
  const initiatePayment = useMutation({
    mutationFn: () => authAxios.post('/api/payments/initiate/', {
      auction_id: auctionId,
      phone_number: phoneNumber
    }),
    onSuccess: (response) => {
      toast.success('STK Push sent! Check your phone.');
      setCheckoutRequestId(response.data.checkout_request_id);
      setIsProcessing(true);
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.error || 'Failed to initiate payment';
      toast.error(errorMsg);
      setIsProcessing(false);
    },
  });

  // Handle countdown timer
  useEffect(() => {
    if (!isProcessing) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsProcessing(false);
          toast.error('Payment timeout. Please try again.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isProcessing]);

  // Check payment status
  useEffect(() => {
    if (!paymentStatus) return;

    if (paymentStatus.has_paid) {
      setIsProcessing(false);
      setPaymentComplete(true);
      toast.success('Payment successful!');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }
  }, [paymentStatus, onSuccess]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate phone number
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    initiatePayment.mutate();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Success view
  if (paymentComplete) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-8 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h3>
          <p className="text-gray-600 mb-4">
            You can now place your pledge in the auction.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Amount Paid</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(amount)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Processing view
  if (isProcessing) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="w-16 h-16 text-green-600 animate-spin" />
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Payment in Progress
            </h3>

            <p className="text-gray-600 mb-4">
              Check your phone for the M-Pesa prompt and enter your PIN
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Smartphone className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">
                  Phone: {phoneNumber}
                </span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(amount)}
              </div>
            </div>

            <div className="mb-6">
              <div className="text-sm text-gray-500 mb-2">Time remaining</div>
              <div className="text-3xl font-mono font-bold text-orange-600">
                {formatTime(countdown)}
              </div>
            </div>

            <div className="flex items-start gap-2 text-left bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Having issues?</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Make sure your phone has M-Pesa registered</li>
                  <li>Check if you have sufficient balance</li>
                  <li>Ensure you have network connectivity</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => {
                setIsProcessing(false);
                setCheckoutRequestId(null);
                setCountdown(120);
              }}
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Cancel Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Initial form view
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Join Auction</h2>

        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 rounded-full p-4">
              <Smartphone className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Pay with M-Pesa
          </h3>
          <p className="text-gray-600">
            Enter your M-Pesa registered phone number
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-600 mb-1">Entry Fee</div>
          <div className="text-3xl font-bold text-orange-600">
            {formatCurrency(amount)}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                +254
              </span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="712345678"
                className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                maxLength="10"
                required
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Format: 0712345678 or 712345678
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">What happens next?</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-800">
                  <li>You'll receive an M-Pesa prompt on your phone</li>
                  <li>Enter your M-Pesa PIN to confirm</li>
                  <li>You'll receive a confirmation SMS</li>
                  <li>You can then place your pledge</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={initiatePayment.isPending || !phoneNumber}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {initiatePayment.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Smartphone className="w-5 h-5" />
                  Pay Now
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
