import { useState, useEffect, useContext } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthContext } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { auctionsAPI } from '../api/endpoints';
import { getRounds, checkParticipation, mockPayment, placeBid } from '../api/bidAPI';
import { formatCurrency, isAuctionActive } from '../utils/helpers';
import Leaderboard from '../components/Leaderboard';
import PaymentModal from '../components/modals/PaymentModal';
import PledgeModal from '../components/PledgeModal';

export default function AuctionDetailPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const [currentRound, setCurrentRound] = useState(null);
  const [hasParticipated, setHasParticipated] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPledgeModal, setShowPledgeModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch product data
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => auctionsAPI.getById(id).then(res => res.data),
  });

  // Redirect to regular product page if it's buy_now only
  if (product && product.product_type === 'buy_now') {
    return <Navigate to={`/product/${id}`} replace />;
  }

  // Fetch rounds
  const { data: rounds, refetch: refetchRounds } = useQuery({
    queryKey: ['rounds', id],
    queryFn: () => getRounds(id),
    enabled: !!product,
  });

  // Set current round
  useEffect(() => {
    if (rounds && rounds.length > 0) {
      // Find active round, or use the MOST RECENT round (highest round_number)
      const activeRound = rounds.find(r => r.is_active);
      if (activeRound) {
        setCurrentRound(activeRound);
      } else {
        // No active round - use the most recent one (last in array)
        const mostRecentRound = rounds.reduce((latest, current) => 
          current.round_number > latest.round_number ? current : latest
        , rounds[0]);
        setCurrentRound(mostRecentRound);
      }
    }
  }, [rounds]);

  // Check participation status
  useEffect(() => {
    const checkUserParticipation = async () => {
      if (isAuthenticated && currentRound) {
        const participated = await checkParticipation(id, currentRound.id);
        setHasParticipated(participated);
      }
    };
    checkUserParticipation();
  }, [isAuthenticated, currentRound, id]);

    // WebSocket connection for real-time updates
  const { isConnected } = useWebSocket(
    id,
    (data) => {
      setLeaderboardData(data);
    },
    (bidData) => {
      console.log('New bid placed:', bidData);
      // Refetch product data to update highest bid display
      queryClient.invalidateQueries(['product', id]);
    },
    async (roundData) => {
      // New round created!
      console.log('🔄 New round started!', roundData);

      // Reset participation status (user needs to pay for new round)
      setHasParticipated(false);

      // Clear leaderboard (fresh start for new round)
      setLeaderboardData(null);

      // Refetch rounds using React Query to update the cache
      try {
        const result = await refetchRounds();

        if (result.data && result.data.length > 0) {
          const newActiveRound = result.data.find(r => r.is_active);
          const roundToSet = newActiveRound || result.data[result.data.length - 1];

          // Update current round state
          setCurrentRound(roundToSet);

          // Show prominent success message with round number
          const roundNumber = roundToSet.round_number;
          setSuccessMessage(`🎯 NEW ROUND ${roundNumber} HAS STARTED! Join now to participate in this round.`);
          setTimeout(() => setSuccessMessage(''), 8000); // Show for 8 seconds

          console.log('✅ Updated to new round:', roundNumber);
        }
      } catch (error) {
        console.error('Error refetching rounds:', error);
      }
    }
  );

  // Handle payment success
  const handlePaymentSuccess = async () => {
    try {
      if (!currentRound) return;
      
      await mockPayment(id, currentRound.id, parseFloat(currentRound.participation_fee));
      
      setHasParticipated(true);
      setSuccessMessage('Payment successful! Now enter your pledge.');
      
      setTimeout(() => {
        setShowPaymentModal(false);
        setShowPledgeModal(true);
        setSuccessMessage('');
      }, 1000);
    } catch (err) {
      console.error('Payment error:', err);
      throw err;
    }
  };

  // Handle pledge success
  const handlePledgeSuccess = async (amount) => {
    try {
      await placeBid(id, amount);
      setSuccessMessage(`Pledge of ${formatCurrency(amount)} submitted successfully!`);
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Pledge error:', err);
      throw err;
    }
  };

  // Handle Join Auction button
  const handleJoinAuction = () => {
    if (!isAuthenticated) {
      alert('Please login to join this auction');
      return;
    }
    setShowPaymentModal(true);
  };

  // Handle Place Pledge button
  const handlePlacePledge = () => {
    if (!isAuthenticated) {
      alert('Please login to place a pledge');
      return;
    }
    setShowPledgeModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-gray-600">Loading auction details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl mb-4">❌</p>
          <p className="text-gray-600">Auction not found</p>
          <Link to="/" className="text-orange-600 hover:underline mt-4 inline-block">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const isActive = isAuctionActive(
    product.start_time,
    product.end_time,
    product.status,
    product.product_type
  );

  return (
    <div className="min-h-screen bg-rose-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-orange-600">BidMarket</Link>
          <nav className="flex items-center gap-6">
            <Link to="/browse" className="text-gray-700 hover:text-orange-600">Browse</Link>
            <Link to="/cart" className="text-gray-700 hover:text-orange-600">Cart</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border-2 border-green-500 rounded-lg p-4 animate-pulse">
            <p className="text-green-800 font-semibold text-center">✅ {successMessage}</p>
          </div>
        )}

        {/* WebSocket Status */}
        <div className="mb-4 flex items-center justify-end gap-2 text-sm">
          {isConnected ? (
            <span className="flex items-center gap-2 text-green-600">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live updates active
            </span>
          ) : (
            <span className="flex items-center gap-2 text-gray-500">
              <span className="inline-block w-2 h-2 bg-gray-400 rounded-full"></span>
              Connecting...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Auction Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Card */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Image */}
              <div className="aspect-video bg-gradient-to-br from-red-100 to-red-200">
                {product.main_image ? (
                  <img
                    src={product.main_image}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-8xl">🎯</span>
                  </div>
                )}
              </div>

              {/* Auction Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {product.title}
                    </h1>
                    {product.category_name && (
                      <Link
                        to={`/category/${product.category_name.toLowerCase()}`}
                        className="text-sm text-orange-600 hover:underline"
                      >
                        {product.category_name}
                      </Link>
                    )}
                  </div>
                  <div>
                    {isActive ? (
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                        <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        LIVE
                      </span>
                    ) : (
                      <span className="bg-gray-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        ENDED
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="prose max-w-none mb-6">
                  <p className="text-gray-700">{product.description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Bidding Controls */}
          <div className="space-y-6">
            {/* Round Info & Actions */}
            {currentRound && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  🎯 Round {currentRound.round_number}
                </h2>

                {/* Round Info */}
                <div className="space-y-3 mb-6">
                  {/* Pledge Range Card */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-xs font-semibold text-gray-600 mb-2 text-center">PLEDGE RANGE</p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 mb-1">Minimum</p>
                        <p className="font-bold text-green-600 text-lg">
                          {formatCurrency(currentRound.min_pledge || currentRound.base_price)}
                        </p>
                      </div>
                      <div className="text-2xl text-gray-400">↔</div>
                      <div className="flex-1 text-right">
                        <p className="text-xs text-gray-600 mb-1">Maximum</p>
                        <p className="font-bold text-red-600 text-lg">
                          {currentRound.max_pledge
                            ? formatCurrency(currentRound.max_pledge)
                            : 'No limit'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-xs text-center text-gray-700">
                        💡 <strong>Tip:</strong> Pledge the MAXIMUM to maximize your chances of winning!
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-sm text-gray-600">Entry Fee:</span>
                    <span className="font-bold text-orange-600">
                      {formatCurrency(currentRound.participation_fee)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Highest:</span>
                    <span className="font-bold text-red-600 text-lg">
                      {product.highest_bid?.amount
                        ? formatCurrency(parseFloat(product.highest_bid.amount))
                        : 'No bids yet'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                {isAuthenticated ? (
                  hasParticipated ? (
                    <button
                      onClick={handlePlacePledge}
                      disabled={!isActive}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-lg font-bold text-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                    >
                      {isActive ? '🎯 Update Your Pledge' : 'Auction Ended'}
                    </button>
                  ) : (
                    <button
                      onClick={handleJoinAuction}
                      disabled={!isActive}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-lg font-bold text-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                    >
                      {isActive ? '🚀 Join This Auction' : 'Auction Ended'}
                    </button>
                  )
                ) : (
                  <Link
                    to="/login"
                    className="block w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-lg font-bold text-lg text-center hover:from-orange-600 hover:to-red-600 transition-all shadow-lg"
                  >
                    🔐 Login to Join Auction
                  </Link>
                )}

                {/* Participation Status */}
                {hasParticipated && (
                  <div className="mt-4 bg-green-50 border-2 border-green-300 rounded-lg p-3">
                    <p className="text-sm text-green-800 text-center font-semibold">
                      ✅ You're in! Update your pledge anytime.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Leaderboard */}
            <Leaderboard
              leaderboardData={leaderboardData}
              currentUserId={user?.id}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPaymentModal && currentRound && (
        <PaymentModal
          auctionId={id}
          roundId={currentRound.id}
          amount={currentRound.participation_fee}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      <PledgeModal
        maximumPledge={currentRound?.max_pledge}
        isOpen={showPledgeModal}
        onClose={() => setShowPledgeModal(false)}
        roundData={currentRound}
        onPledgeSuccess={handlePledgeSuccess}
      />
    </div>
  );
}
