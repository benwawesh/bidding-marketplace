import { useState } from 'react';
import { formatCurrency } from '../../utils/helpers';

export default function SetRangeModal({ isOpen, onClose, auction, onActivate }) {
  const [minPledge, setMinPledge] = useState(auction?.base_price || '');
  const [maxPledge, setMaxPledge] = useState((auction?.base_price * 10) || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !auction) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const min = parseFloat(minPledge);
    const max = parseFloat(maxPledge);
    
    // Validation
    if (isNaN(min) || isNaN(max)) {
      alert('Please enter valid numbers');
      return;
    }
    
    if (min <= 0 || max <= 0) {
      alert('Amounts must be greater than 0');
      return;
    }
    
    if (min >= max) {
      alert('Maximum must be greater than minimum');
      return;
    }
    
    if (min < auction.base_price) {
      alert(`Minimum pledge cannot be less than base price (${formatCurrency(auction.base_price)})`);
      return;
    }
    
    setLoading(true);
    try {
      await onActivate({ min_pledge: min, max_pledge: max });
    } catch (error) {
      console.error('Activation error:', error);
      alert('Failed to activate auction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🎯 Set Pledge Range for Round 1
        </h2>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Set the minimum and maximum pledge amounts that buyers can bid within.
          </p>
          
          {/* Base Price Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-600 mb-1">Base Price (Starting Bid)</p>
            <p className="text-2xl font-bold text-blue-900">{formatCurrency(auction.base_price)}</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Minimum Pledge */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Minimum Pledge (KES)
              </label>
              <input
                type="number"
                value={minPledge}
                onChange={(e) => setMinPledge(e.target.value)}
                placeholder={`At least ${auction.base_price}`}
                min={auction.base_price}
                step="100"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-xl font-bold"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be at least {formatCurrency(auction.base_price)}
              </p>
            </div>

            {/* Maximum Pledge */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Maximum Pledge (KES)
              </label>
              <input
                type="number"
                value={maxPledge}
                onChange={(e) => setMaxPledge(e.target.value)}
                placeholder="Maximum amount"
                min={minPledge || auction.base_price}
                step="100"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-xl font-bold"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be greater than minimum
              </p>
            </div>

            {/* Preview */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-green-900 mb-2 text-center">
                📊 Buyers Can Bid Between
              </p>
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <p className="text-xs text-green-700">Min</p>
                  <p className="text-xl font-bold text-green-900">
                    {minPledge ? formatCurrency(minPledge) : '---'}
                  </p>
                </div>
                <div className="text-2xl text-green-600 font-bold px-2">→</div>
                <div className="text-center flex-1">
                  <p className="text-xs text-green-700">Max</p>
                  <p className="text-xl font-bold text-green-900">
                    {maxPledge ? formatCurrency(maxPledge) : '---'}
                  </p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-800">
                ⚠️ Once activated, buyers will only be able to place bids within this range.
                You can create Round 2 later with a different range.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Activating...' : '✅ Activate Auction'}
              </button>
              
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
