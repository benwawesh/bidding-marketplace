import { useState, useEffect, useContext } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthContext } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAudio } from '../hooks/useAudio';
import { auctionsAPI } from '../api/endpoints';
import { getRounds, checkParticipation, placeBid } from '../api/bidAPI';
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

  // Initialize audio for background music (if auction has music)
  const {
    isPlaying,
    toggle: toggleMusic,
    setVolume,
    currentVolume,
    isMuted,
    toggleMute,
  } = useAudio(product?.background_music || null, {
    autoPlay: true,
    loop: true,
    volume: 0.3,
  });

  // Redirect to regular product page if it's buy_now only
  if (product && product.product_type === 'buy_now') {
    return <Navigate to={`/product/${id}`} replace />;
  }

  // Fetch rounds with automatic polling every 10 seconds for real-time updates
  const { data: rounds, refetch: refetchRounds } = useQuery({
    queryKey: ['rounds', id],
    queryFn: () => getRounds(id),
    enabled: !!product,
    refetchInterval: 10000, // Poll every 10 seconds as backup to WebSocket
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

      // Payment is already completed via M-Pesa, just update UI
      setHasParticipated(true);
      setSuccessMessage('✅ Payment successful! You can now place your pledge.');

      // Show success message then open pledge modal
      setTimeout(() => {
        setShowPaymentModal(false);
        setShowPledgeModal(true);
        setSuccessMessage('');
      }, 1500);
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

  // Check if auction is active AND current round is active
  const isActive = isAuctionActive(
    product.start_time,
    product.end_time,
    product.status,
    product.product_type
  ) && (currentRound?.is_active ?? false);

  return (
    <div className="min-h-screen bg-orange-50">
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

        {/* Floating Music Player Controls - Only show if music exists */}
        {product?.background_music && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="bg-white rounded-full shadow-2xl border-2 border-orange-500 p-3 flex items-center gap-3">
              {/* Play/Pause Button */}
              <button
                onClick={toggleMusic}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-center hover:from-orange-600 hover:to-red-600 transition-all shadow-lg"
                aria-label={isPlaying ? 'Pause music' : 'Play music'}
              >
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Volume Control */}
              <div className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-2">
                <button
                  onClick={toggleMute}
                  className="text-gray-600 hover:text-orange-600 transition"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : currentVolume * 100}
                  onChange={(e) => {
                    const newVolume = parseInt(e.target.value) / 100;
                    setVolume(newVolume);
                    if (isMuted && newVolume > 0) {
                      toggleMute(); // Unmute if user adjusts volume
                    }
                  }}
                  className="w-20 h-2 bg-gray-300 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #f97316 0%, #f97316 ${isMuted ? 0 : currentVolume * 100}%, #d1d5db ${isMuted ? 0 : currentVolume * 100}%, #d1d5db 100%)`
                  }}
                />
              </div>

              {/* Music Icon Animation */}
              {isPlaying && (
                <div className="flex items-center gap-1">
                  <div className="w-1 bg-orange-500 rounded-full animate-bounce" style={{ height: '12px', animationDelay: '0ms', animationDuration: '600ms' }}></div>
                  <div className="w-1 bg-orange-500 rounded-full animate-bounce" style={{ height: '16px', animationDelay: '150ms', animationDuration: '600ms' }}></div>
                  <div className="w-1 bg-orange-500 rounded-full animate-bounce" style={{ height: '10px', animationDelay: '300ms', animationDuration: '600ms' }}></div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Auction Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Card */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Image - Better display with object-contain */}
              <div className="w-full bg-white flex items-center justify-center" style={{ minHeight: '400px' }}>
                {product.main_image ? (
                  <img
                    src={product.main_image}
                    alt={product.title}
                    className="w-full h-full object-contain max-h-[500px]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-100 to-red-200">
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
                  🎯 Round {currentRound.round_number} {!currentRound.is_active && <span className="text-red-600">(CLOSED)</span>}
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
