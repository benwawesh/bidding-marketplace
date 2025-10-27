import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/helpers';
import { getMyLatestBidForRound } from '../api/bidAPI';
import { useParams } from 'react-router-dom';

export default function PledgeModal({ isOpen, onClose, roundData, onPledgeSuccess, maximumPledge }) {
  const { id: auctionId } = useParams();
  const [pledgeAmount, setPledgeAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [previousPledge, setPreviousPledge] = useState(null);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);

  // Fetch user's previous pledge when modal opens
  useEffect(() => {
    const fetchPreviousPledge = async () => {
      if (isOpen && roundData && auctionId) {
        setIsLoadingPrevious(true);
        const latestBid = await getMyLatestBidForRound(auctionId, roundData.id);
        setPreviousPledge(latestBid);
        setIsLoadingPrevious(false);
      }
    };
    fetchPreviousPledge();
  }, [isOpen, roundData, auctionId]);

  if (!isOpen || !roundData) return null;

  const minPledge = parseFloat(roundData.min_pledge || roundData.base_price);
  const maxPledge = maximumPledge ? parseFloat(maximumPledge) : null;
  const enteredAmount = pledgeAmount ? parseFloat(pledgeAmount) : 0;
  const previousAmount = previousPledge ? parseFloat(previousPledge.pledge_amount) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation: Check minimum pledge
    if (!pledgeAmount || enteredAmount < minPledge) {
      setError(`Pledge must be at least ${formatCurrency(minPledge)}`);
      return;
    }

    // Validation: Check maximum pledge
    if (maxPledge && enteredAmount > maxPledge) {
      setError(`Pledge cannot exceed ${formatCurrency(maxPledge)}`);
      return;
    }

    // Validation: Check if updating to a lower amount than previous pledge
    if (previousAmount && enteredAmount < previousAmount) {
      setError(`You cannot lower your pledge! Your current pledge is ${formatCurrency(previousAmount)}. You can only increase it.`);
      return;
    }

    setIsSubmitting(true);

    try {
      await onPledgeSuccess(enteredAmount);
      onClose();
      setPledgeAmount('');
      setPreviousPledge(null);
    } catch (err) {
      setError(err.message || 'Failed to place pledge. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-600">Round {roundData.round_number}</span>
              <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                ✓ Paid
              </span>
            </div>

            {/* Pledge Range */}
            <div className="bg-white rounded-lg p-3 mb-3">
              <p className="text-xs font-semibold text-gray-500 mb-2 text-center">PLEDGE RANGE</p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs text-gray-600 mb-1">Minimum</p>
                  <p className="font-bold text-green-600">
                    {formatCurrency(minPledge)}
                  </p>
                </div>
                <div className="text-xl text-gray-400">↔</div>
                <div className="flex-1 text-right">
                  <p className="text-xs text-gray-600 mb-1">Maximum</p>
                  <p className="font-bold text-red-600">
                    {maxPledge ? formatCurrency(maxPledge) : 'No limit'}
                  </p>
                </div>
              </div>
            </div>

            {/* Previous Pledge (if exists) */}
            {isLoadingPrevious ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                <p className="text-xs text-blue-600">Loading your previous pledge...</p>
              </div>
            ) : previousPledge ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-blue-600 font-semibold">Your Current Pledge:</span>
                  <span className="font-bold text-blue-800 text-lg">
                    {formatCurrency(previousAmount)}
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  💡 You can only increase your pledge, not lower it
                </p>
              </div>
            ) : null}
          </div>

          {/* Pledge Input */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {previousPledge ? 'Update Your Pledge Amount' : 'Your Pledge Amount'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                Ksh
              </span>
              <input
                type="number"
                value={pledgeAmount}
                onChange={(e) => setPledgeAmount(e.target.value)}
                min={previousAmount || minPledge}
                max={maxPledge || undefined}
                step="1"
                placeholder={previousAmount ? `Min: ${previousAmount}` : `Min: ${minPledge}`}
                className="w-full pl-14 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-lg font-semibold"
                disabled={isSubmitting || isLoadingPrevious}
              />
            </div>
            {enteredAmount > 0 && enteredAmount >= minPledge && (!maxPledge || enteredAmount <= maxPledge) && (
              <p className="text-sm text-green-600 mt-2">
                ✓ Valid pledge amount
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Helpful Tips */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold text-gray-800 mb-2">
              🏆 <strong>How to Win:</strong>
            </p>
            <ul className="text-sm text-gray-700 space-y-1 ml-1">
              <li>• <strong>Pledge the MAXIMUM amount</strong> to maximize your chances of winning!</li>
              <li>• The <strong>highest pledge wins</strong> this round</li>
              <li>• You can <strong>update your pledge</strong> anytime during the round</li>
              <li>• You can only <strong>increase</strong> your pledge, not lower it</li>
            </ul>
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
              disabled={isSubmitting || isLoadingPrevious || !pledgeAmount || enteredAmount < minPledge || (maxPledge && enteredAmount > maxPledge)}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Submitting...
                </>
              ) : previousPledge ? (
                <>
                  🔄 Update Pledge
                </>
              ) : (
                <>
                  🎯 Lock In Pledge
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
