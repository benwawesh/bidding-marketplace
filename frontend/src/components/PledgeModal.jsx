import { useState } from 'react';
import { formatCurrency } from '../utils/helpers';

export default function PledgeModal({ isOpen, onClose, roundData, onPledgeSuccess }) {
  const [pledgeAmount, setPledgeAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !roundData) return null;

  const minPledge = parseFloat(roundData.base_price);
  const enteredAmount = pledgeAmount ? parseFloat(pledgeAmount) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!pledgeAmount || enteredAmount < minPledge) {
      setError(`Pledge must be at least ${formatCurrency(minPledge)}`);
      return;
    }

    setIsSubmitting(true);

    try {
      await onPledgeSuccess(enteredAmount);
      onClose();
      setPledgeAmount('');
    } catch (err) {
      setError(err.message || 'Failed to place pledge. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickPledge = (amount) => {
    setPledgeAmount(amount.toString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">🎯 Place Your Pledge</h2>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-white hover:text-gray-200 text-2xl font-bold disabled:opacity-50"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Round Info */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Round {roundData.round_number}</span>
              <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                ✓ Paid
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Minimum Pledge:</span>
              <span className="font-bold text-orange-600 text-lg">
                {formatCurrency(roundData.base_price)}
              </span>
            </div>
          </div>

          {/* Pledge Input */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Pledge Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                Ksh
              </span>
              <input
                type="number"
                value={pledgeAmount}
                onChange={(e) => setPledgeAmount(e.target.value)}
                min={minPledge}
                step="1"
                placeholder={`Min: ${minPledge}`}
                className="w-full pl-14 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-lg font-semibold"
                disabled={isSubmitting}
              />
            </div>
            {enteredAmount > 0 && enteredAmount >= minPledge && (
              <p className="text-sm text-green-600 mt-2">
                ✓ Valid pledge amount
              </p>
            )}
          </div>

          {/* Quick Pledge Buttons */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-2">Quick Pledge:</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickPledge(minPledge)}
                className="px-4 py-2 border-2 border-orange-300 text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-all"
                disabled={isSubmitting}
              >
                Min
              </button>
              <button
                type="button"
                onClick={() => handleQuickPledge(minPledge + 1000)}
                className="px-4 py-2 border-2 border-orange-300 text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-all"
                disabled={isSubmitting}
              >
                +1,000
              </button>
              <button
                type="button"
                onClick={() => handleQuickPledge(minPledge + 5000)}
                className="px-4 py-2 border-2 border-orange-300 text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-all"
                disabled={isSubmitting}
              >
                +5,000
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Important:</strong> Once submitted, your pledge cannot be changed. Make sure you can afford this amount if you win!
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !pledgeAmount || enteredAmount < minPledge}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Submitting...
                </>
              ) : (
                <>
                  Lock In Pledge
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
