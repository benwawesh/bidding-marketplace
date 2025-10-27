import { useState } from 'react';
import { formatCurrency } from '../utils/helpers';

export default function PaymentModal({ isOpen, onClose, roundData, onPaymentSuccess }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !roundData) return null;

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Mock payment - replace with real M-Pesa integration later
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate payment delay
      
      // Call success callback
      await onPaymentSuccess();
      
      onClose();
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">💳 Join Round {roundData.round_number}</h2>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="text-white hover:text-gray-200 text-2xl font-bold disabled:opacity-50"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Round Info */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Round Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Round Number:</span>
                <span className="font-semibold">Round {roundData.round_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pledge Range:</span>
                <span className="font-semibold">
                  {formatCurrency(roundData.base_price)} - Unlimited
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Entry Fee:</span>
                <span className="font-bold text-orange-600 text-lg">
                  {formatCurrency(roundData.participation_fee)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Payment Method</h3>
            <div className="border-2 border-orange-300 rounded-lg p-4 bg-orange-50">
              <div className="flex items-center gap-3">
                <div className="text-3xl">📱</div>
                <div>
                  <p className="font-semibold text-gray-900">M-Pesa (Mock)</p>
                  <p className="text-sm text-gray-600">Instant payment processing</p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> After payment, you'll immediately be prompted to enter your pledge amount.
              Your pledge must be at least {formatCurrency(roundData.base_price)}.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Processing...
                </>
              ) : (
                <>
                  Pay {formatCurrency(roundData.participation_fee)}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
