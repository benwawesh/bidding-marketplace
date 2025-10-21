import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from '../../api/axios';
import { formatCurrency } from '../../utils/helpers';

export default function PledgeModal({ isOpen, onClose, roundData, onPledgeSuccess, maximumPledge }) {
  const [pledgeAmount, setPledgeAmount] = useState('');

  if (!isOpen || !roundData) return null;

  const minimumPledge = roundData.min_pledge || roundData.base_price;
  const maxPledge = maximumPledge || roundData.max_pledge;

  const pledgeMutation = useMutation({
    mutationFn: async (amount) => {
      const response = await axios.post('http://127.0.0.1:8000/api/bids/', {
        auction: roundData.auction,
        round: roundData.id,
        pledge_amount: amount,
      });
      return response.data;
    },
    onSuccess: () => {
      // Close modal and notify parent
      onPledgeSuccess();
      onClose();
    },
    onError: (error) => {
      alert('Failed to place bid: ' + (error.response?.data?.error || error.message));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const amount = parseFloat(pledgeAmount);
    
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (amount < minimumPledge) {
      alert(`Minimum pledge is ${formatCurrency(minimumPledge)}`);
      return;
    }

    if (amount > maxPledge) {
      alert(`Maximum pledge is ${formatCurrency(maxPledge)}`);
      return;
    }

    pledgeMutation.mutate(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Place Your Bid</h2>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Enter the amount you want to pledge. The highest pledge wins!
          </p>
          
          {/* Pledge Range Display */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold text-blue-900 mb-2 text-center">💰 Allowed Pledge Range</p>
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <p className="text-xs text-blue-600">Minimum</p>
                <p className="text-xl font-bold text-blue-900">{formatCurrency(minimumPledge)}</p>
              </div>
              <div className="text-2xl text-blue-400 font-bold px-2">→</div>
              <div className="text-center flex-1">
                <p className="text-xs text-blue-600">Maximum</p>
                <p className="text-xl font-bold text-blue-900">{formatCurrency(maxPledge)}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Pledge Amount (KES)
              </label>
              <input
                type="number"
                value={pledgeAmount}
                onChange={(e) => setPledgeAmount(e.target.value)}
                placeholder={`Between ${minimumPledge} - ${maxPledge}`}
                min={minimumPledge}
                max={maxPledge}
                step="100"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-xl font-bold"
                required
                disabled={pledgeMutation.isPending}
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 Bid strategically within {formatCurrency(minimumPledge)} - {formatCurrency(maxPledge)}
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-green-900 mb-1">🎯 How Bidding Works</p>
              <ul className="text-xs text-green-800 space-y-1 ml-4 list-disc">
                <li>Pledge must be between {formatCurrency(minimumPledge)} and {formatCurrency(maxPledge)}</li>
                <li>You only pay if you win the auction</li>
                <li>Highest pledge wins when admin closes auction</li>
                <li>Update your bid anytime before closing</li>
              </ul>
            </div>

            {pledgeMutation.isPending && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  ⚡ Placing bid... Updates will appear instantly!
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={pledgeMutation.isPending}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {pledgeMutation.isPending ? '⚡ Placing Bid...' : '🎯 Place Bid'}
              </button>
              
              <button
                type="button"
                onClick={onClose}
                disabled={pledgeMutation.isPending}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
