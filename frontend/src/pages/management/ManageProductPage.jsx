import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ManagementLayout from '../../components/layout/ManagementLayout';
import { auctionsAPI } from '../../api/endpoints';
import { formatCurrency, getTimeRemaining, isAuctionActive } from '../../utils/helpers';
import axios from '../../api/axios';
import SetRangeModal from '../../components/modals/SetRangeModal';
import AuctionRoundsTab from './AuctionRoundsTab';


// Sales Stats Tab Component
function SalesStatsTab({ productId }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['sales-stats', productId],
    queryFn: () => auctionsAPI.getSalesStats(productId).then(res => res.data),
  });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading stats...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Sales Data</h3>
        <p className="text-gray-600">No purchases have been made yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Sales Performance</h2>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-600">
          <p className="text-sm text-gray-600 uppercase font-semibold">Total Orders</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.total_orders}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-6 border-l-4 border-purple-600">
          <p className="text-sm text-gray-600 uppercase font-semibold">Units Sold</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">{stats.total_units_sold}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-600">
          <p className="text-sm text-gray-600 uppercase font-semibold">Total Revenue</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(stats.total_revenue)}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-6 border-l-4 border-orange-600">
          <p className="text-sm text-gray-600 uppercase font-semibold">Avg Order Value</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{formatCurrency(stats.average_order_value)}</p>
        </div>
      </div>

      {/* Orders by Status */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Orders by Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(stats.orders_by_status || {}).map(([status, count]) => (
            <div key={status} className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 capitalize">{status}</p>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Product Info */}
      <div className="border-t mt-6 pt-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Buy Now Price</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.buy_now_price)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Stock Remaining</p>
            <p className="text-xl font-bold text-gray-900">{stats.stock_quantity}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ManageProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');


   

  // Fetch product details
  const { data: product, isLoading, refetch } = useQuery({
    queryKey: ['product', id],
    queryFn: () => auctionsAPI.getById(id).then(res => res.data),
  });

  // Handle activation with custom range
  const handleActivateWithRange = async (rangeData) => {
    try {
      await axios.post(
        `/api/auctions/${id}/activate/`,
        rangeData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('bidmarket_access_token')}`,
          },
        }
      );
      alert(`✅ Auction activated! Buyers can bid between ${formatCurrency(rangeData.min_pledge)} - ${formatCurrency(rangeData.max_pledge)}`);
      refetch();
      setShowRangeModal(false);
    } catch (error) {
      console.error('Activation error:', error);
      alert('Failed to activate: ' + (error.response?.data?.error || error.message));
      throw error;
    }
  };

  // Close mutation
const closeMutation = useMutation({
  mutationFn: async () => {
    if (!currentRound) throw new Error("No active round found");

    const response = await axios.post(
      `/rounds/${currentRound.id}/close/`, // Remove /api prefix - axios instance already has it
      {}
    );
    return response.data;
  },
  onSuccess: (data) => {
    alert(`✅ ${data.message}\nWinner: ${data.winner.username}\nAmount: ${formatCurrency(data.winner.amount)}`);
    queryClient.invalidateQueries(['product', id]);
  },
  onError: (error) => {
    alert('Failed to close: ' + (error.response?.data?.error || error.message));
  },
});



    // Create Next Round Mutation
  const createNextRoundMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `/auctions/${id}/create_next_round/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('bidmarket_access_token')}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      alert(`✅ Next round created successfully!\nRound ID: ${data.round_id}\nRegistration Fee: ${formatCurrency(data.registration_fee)}`);
      queryClient.invalidateQueries(['product', id]);
    },
    onError: (error) => {
      console.error('Error creating next round:', error);
      alert('❌ Failed to create next round: ' + (error.response?.data?.error || error.message));
    },
  });

  const handleCreateNextRound = () => {
    if (window.confirm('Are you sure you want to create the next round for this auction?')) {
      createNextRoundMutation.mutate();
    }
  };


  const handleClose = () => {
    if (window.confirm('Are you sure you want to close this auction? This will select the highest bidder as the winner.')) {
      closeMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <ManagementLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading product...</p>
          </div>
        </div>
      </ManagementLayout>
    );
  }

  if (!product) {
    return (
      <ManagementLayout>
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 mb-4">Product not found</p>
          <Link to="/management/products" className="text-orange-600 hover:underline">
            Back to Products
          </Link>
        </div>
      </ManagementLayout>
    );
  }

  const isActive = isAuctionActive(
    product.start_time,
    product.end_time,
    product.status,
    product.product_type
  );

  const timeRemaining = getTimeRemaining(product.end_time);
  const timeString = timeRemaining.days > 0
    ? `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m`
    : `${timeRemaining.hours}h ${timeRemaining.minutes}m`;

  const showAuctionTabs = product.product_type === 'auction' || product.product_type === 'both';
  const showBuyNowTabs = product.product_type === 'buy_now' || product.product_type === 'both';
  const currentRound = product.rounds?.find(r => r.is_active) || product.rounds?.[product.rounds.length - 1];

  return (
    <ManagementLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/management/products" className="text-orange-600 hover:underline mb-2 inline-block">
              ← Back to Products
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>
          </div>
          <div className="flex gap-3">
            {showAuctionTabs && (
              <Link
                to={`/management/products/${id}/winner`}
                className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 font-bold shadow-lg"
              >
                🏆 Calculate Winner
              </Link>
            )}

            <Link
              to={`/management/products/${id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ✏️ Edit
            </Link>

           <button
            onClick={() => navigate(`/management/products/${id}/create-next-round`)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            ➕ Create Next Round
          </button>


          </div>
        </div>

        {/* Tabs - Different for Auction vs Buy Now */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-gray-200 flex-wrap">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 'overview'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Overview
            </button>

            {/* Auction-specific tabs */}
            {showAuctionTabs && (
              <>
                <button
                  onClick={() => setActiveTab('participants')}
                  className={`px-6 py-3 font-semibold transition ${
                    activeTab === 'participants'
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  👥 Participants
                </button>
                <button
                  onClick={() => setActiveTab('bids')}
                  className={`px-6 py-3 font-semibold transition ${
                    activeTab === 'bids'
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🎯 All Bids
                </button>
                <button
                  onClick={() => setActiveTab('revenue')}
                  className={`px-6 py-3 font-semibold transition ${
                    activeTab === 'revenue'
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  💰 Revenue
                </button>

                <button
                  onClick={() => setActiveTab('rounds')}
                  className={`px-6 py-3 font-semibold transition ${
                    activeTab === 'rounds'
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🏁 Rounds
                </button>

              </>
            )}

            {/* Buy Now-specific tabs */}
            {showBuyNowTabs && (
              <>
                <button
                  onClick={() => setActiveTab('buyers')}
                  className={`px-6 py-3 font-semibold transition ${
                    activeTab === 'buyers'
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🛒 Buyers
                </button>
                <button
                  onClick={() => setActiveTab('sales')}
                  className={`px-6 py-3 font-semibold transition ${
                    activeTab === 'sales'
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📈 Sales Stats
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Product Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Main Card */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Image */}
                <div className="aspect-video bg-gradient-to-br from-orange-100 to-orange-200">
                  {product.main_image ? (
                    <img
                      src={product.main_image}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-8xl">📦</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Category</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {product.category_info?.name || 'Uncategorized'}
                      </p>
                    </div>
                    <div>
                      {product.status === 'active' ? (
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          LIVE
                        </span>
                      ) : product.status === 'draft' ? (
                        <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          DRAFT
                        </span>
                      ) : (
                        <span className="bg-gray-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          CLOSED
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="prose max-w-none mb-4">
                    <p className="text-gray-700">{product.description}</p>
                  </div>

                  {/* Product Type */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600 font-semibold mb-1">Product Type</p>
                    <p className="text-lg font-bold text-blue-900 capitalize">
                      {product.product_type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Stats & Actions */}
            <div className="space-y-6">
              {/* Stats Card */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Statistics</h2>

                <div className="space-y-4">
                  {/* Auction Stats */}
                  {showAuctionTabs && currentRound && (
                    <>
                      <div className="bg-orange-50 rounded-lg p-3 mb-4">
                        <p className="text-sm text-orange-600 font-semibold">Current Round</p>
                        <p className="text-2xl font-bold text-orange-800">
                          Round {currentRound.round_number}
                        </p>
                        {currentRound.is_active ? (
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">ACTIVE</span>
                        ) : (
                          <span className="text-xs bg-gray-500 text-white px-2 py-1 rounded-full">CLOSED</span>
                        )}
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Min Pledge Range</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(currentRound.min_pledge)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Max Pledge Range</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(currentRound.max_pledge)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Entry Fee</p>
                        <p className="text-xl font-bold text-orange-600">
                          {formatCurrency(currentRound.participation_fee)}
                        </p>
                      </div>

                      {currentRound.is_active && (
                        <>
                          <div className="border-t pt-4">
                            <p className="text-sm text-gray-600">Current Highest Pledge</p>
                            <p className="text-2xl font-bold text-red-600">
                              {currentRound.participants?.length > 0 &&
                               currentRound.participants.some(p => p.pledge_amount)
                                ? formatCurrency(Math.max(...currentRound.participants.map(p => p.pledge_amount || 0)))
                                : 'No pledges yet'}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-600">Participants (Round {currentRound.round_number})</p>
                            <p className="text-xl font-bold text-gray-900">
                              {currentRound.participant_count || 0}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-600">Total Bids</p>
                            <p className="text-xl font-bold text-gray-900">
                              {currentRound.bid_count || 0}
                            </p>
                          </div>
                        </>
                      )}

                      {!currentRound.is_active && currentRound.winner && (
                        <div className="border-t pt-4">
                          <p className="text-sm text-gray-600 mb-2">🏆 Round {currentRound.round_number} Winner</p>
                          <p className="text-lg font-bold text-green-600">
                            {currentRound.winner.username}
                          </p>
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(currentRound.winner.pledge_amount)}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {showAuctionTabs && !currentRound && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No rounds created yet</p>
                      <button
                        onClick={() => setShowRangeModal(true)}
                        className="mt-4 text-orange-600 hover:underline font-semibold"
                      >
                        Create First Round →
                      </button>
                    </div>
                  )}

                  {/* Buy Now Stats */}
                  {showBuyNowTabs && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Buy Now Price</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(product.buy_now_price)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Stock Remaining</p>
                        <p className="text-xl font-bold text-gray-900">
                          {product.stock_quantity}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Units Sold</p>
                        <p className="text-xl font-bold text-purple-600">
                          {product.units_sold || 0}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Actions Card */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">⚡ Actions</h2>

                {product.status === 'draft' && showAuctionTabs && (
                  <button
                    onClick={() => setShowRangeModal(true)}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 mb-3"
                  >
                    ✅ Activate Auction
                  </button>
                )}

                {product.status === 'active' && showAuctionTabs && (
                  <button
                    onClick={handleClose}
                    disabled={closeMutation.isPending}
                    className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 disabled:bg-gray-400 mb-3"
                  >
                    {closeMutation.isPending ? '⏳ Closing...' : '🏁 Close Auction'}
                  </button>
                )}

                <Link
                  to={product.product_type === 'auction' ? `/auction/${id}` : `/product/${id}`}
                  className="block w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 text-center"
                >
                  👁️ View as Customer
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'participants' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">All Participants by Round</h2>

            {/* Overall Summary Across All Rounds */}
            {product.rounds?.length > 0 && (
              <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl shadow-2xl p-6 text-white mb-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <span>📊</span> Overall Statistics (All Rounds)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <p className="text-purple-100 text-sm font-semibold mb-1">Total Rounds</p>
                    <p className="text-4xl font-bold">{product.rounds.length}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <p className="text-purple-100 text-sm font-semibold mb-1">Total Participants</p>
                    <p className="text-4xl font-bold">
                      {product.rounds.reduce((sum, round) => sum + (round.participant_count || 0), 0)}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <p className="text-purple-100 text-sm font-semibold mb-1">Total Revenue</p>
                    <p className="text-4xl font-bold">
                      {formatCurrency(
                        product.rounds.reduce((sum, round) =>
                          sum + ((round.participation_fee || 0) * (round.participant_count || 0)), 0
                        )
                      )}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <p className="text-purple-100 text-sm font-semibold mb-1">Total Bids</p>
                    <p className="text-4xl font-bold">
                      {product.rounds.reduce((sum, round) => sum + (round.bid_count || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {product.rounds?.length > 0 ? (
              product.rounds
                .sort((a, b) => b.round_number - a.round_number) // Show newest rounds first
                .map((round) => (
                  <div key={round.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Round Header */}
                    <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-bold">Round {round.round_number}</h3>
                          <p className="text-red-100 text-sm mt-1">
                            Entry Fee: {formatCurrency(round.participation_fee)} |
                            Pledge Range: {formatCurrency(round.min_pledge)} - {formatCurrency(round.max_pledge)}
                          </p>
                        </div>
                        <div className="text-right">
                          {round.is_active ? (
                            <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="bg-gray-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                              CLOSED
                            </span>
                          )}
                          <p className="text-red-100 text-sm mt-2">
                            {round.participant_count || 0} Participants | {round.bid_count || 0} Bids
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Revenue & Stats Summary */}
                    <div className="bg-gray-50 border-b border-gray-200 p-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Participants</p>
                          <p className="text-2xl font-bold text-blue-600">{round.participant_count || 0}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Revenue (Entry Fees)</p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency((round.participation_fee || 0) * (round.participant_count || 0))}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Highest Pledge</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {round.participants && round.participants.length > 0 &&
                             round.participants.some(p => p.pledge_amount)
                              ? formatCurrency(Math.max(...round.participants.map(p => p.pledge_amount || 0)))
                              : formatCurrency(0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Participants Table */}
                    <div className="p-6">
                      {round.participants && round.participants.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b-2 border-gray-200">
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Username</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Age</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700">Pledge Amount</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Payment Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {round.participants
                                .filter(p => p.payment_status === 'completed') // Only show paid participants
                                .sort((a, b) => (b.pledge_amount || 0) - (a.pledge_amount || 0)) // Sort by pledge amount descending
                                .map((participant, index) => (
                                  <tr
                                    key={participant.id}
                                    className={`border-b border-gray-100 hover:bg-gray-50 transition ${
                                      index === 0 ? 'bg-yellow-50' : ''
                                    }`}
                                  >
                                    <td className="py-3 px-4">
                                      {index === 0 ? (
                                        <span className="text-2xl">🏆</span>
                                      ) : (
                                        <span className="font-semibold text-gray-600">#{index + 1}</span>
                                      )}
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className="font-medium text-gray-900">
                                        {participant.user?.first_name} {participant.user?.last_name}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className="text-gray-600">@{participant.user?.username}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="text-sm text-gray-600">
                                        <div>{participant.user?.email}</div>
                                        <div>{participant.user?.phone_number}</div>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className="text-gray-600">{participant.user?.age || 'N/A'}</span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                      {participant.pledge_amount ? (
                                        <span className={`font-bold text-lg ${
                                          index === 0 ? 'text-green-600' : 'text-gray-900'
                                        }`}>
                                          {formatCurrency(participant.pledge_amount)}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 italic">No bid yet</span>
                                      )}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                        participant.payment_status === 'completed'
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {participant.payment_status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="text-6xl mb-4">👥</div>
                          <p className="text-gray-500 text-lg">No participants in this round yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Rounds Created Yet</h3>
                <p className="text-gray-600">Create your first auction round to start accepting participants</p>
              </div>
            )}
          </div>
        )}


        {activeTab === 'bids' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">All Bids History</h2>

            {/* Overall Bids Summary */}
            {product.rounds?.length > 0 && (() => {
              // Collect all bids from all rounds
              const allBids = product.rounds.flatMap(round =>
                (round.participants || [])
                  .filter(p => p.pledge_amount && p.payment_status === 'completed')
                  .map(p => ({
                    ...p,
                    round_number: round.round_number,
                    round_id: round.id
                  }))
              );

              const totalBids = product.rounds.reduce((sum, round) => sum + (round.bid_count || 0), 0);
              const highestBid = allBids.length > 0 ? Math.max(...allBids.map(b => b.pledge_amount)) : 0;
              const averageBid = allBids.length > 0 ? allBids.reduce((sum, b) => sum + b.pledge_amount, 0) / allBids.length : 0;

              return (
                <>
                  <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-2xl p-6 text-white mb-8">
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                      <span>🎯</span> Overall Bids Statistics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <p className="text-purple-100 text-sm font-semibold mb-1">Total Bids</p>
                        <p className="text-4xl font-bold">{totalBids}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <p className="text-purple-100 text-sm font-semibold mb-1">Unique Bidders</p>
                        <p className="text-4xl font-bold">{allBids.length}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <p className="text-purple-100 text-sm font-semibold mb-1">Highest Bid</p>
                        <p className="text-3xl font-bold">{formatCurrency(highestBid)}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <p className="text-purple-100 text-sm font-semibold mb-1">Average Bid</p>
                        <p className="text-3xl font-bold">{formatCurrency(averageBid)}</p>
                      </div>
                    </div>
                  </div>

                  {/* All Bids Table - Grouped by Round */}
                  {product.rounds
                    .sort((a, b) => b.round_number - a.round_number)
                    .map(round => {
                      const roundBids = (round.participants || [])
                        .filter(p => p.pledge_amount && p.payment_status === 'completed')
                        .sort((a, b) => b.pledge_amount - a.pledge_amount);

                      return (
                        <div key={round.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                          {/* Round Header */}
                          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-2xl font-bold">Round {round.round_number}</h3>
                                <p className="text-purple-100 text-sm mt-1">
                                  {roundBids.length} Bids | Highest: {roundBids.length > 0 ? formatCurrency(roundBids[0].pledge_amount) : 'N/A'}
                                </p>
                              </div>
                              <div className="text-right">
                                {round.is_active ? (
                                  <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                                    ACTIVE
                                  </span>
                                ) : (
                                  <span className="bg-gray-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                                    CLOSED
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Bids Table */}
                          <div className="p-6">
                            {roundBids.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b-2 border-gray-200">
                                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Bidder Name</th>
                                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Username</th>
                                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact</th>
                                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Age</th>
                                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Bid Amount</th>
                                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {roundBids.map((bid, index) => (
                                      <tr
                                        key={bid.id}
                                        className={`border-b border-gray-100 hover:bg-gray-50 transition ${
                                          index === 0 ? 'bg-yellow-50' : ''
                                        }`}
                                      >
                                        <td className="py-3 px-4">
                                          {index === 0 ? (
                                            <div className="flex items-center gap-2">
                                              <span className="text-2xl">🏆</span>
                                              <span className="font-bold text-yellow-600">#1</span>
                                            </div>
                                          ) : index === 1 ? (
                                            <div className="flex items-center gap-2">
                                              <span className="text-xl">🥈</span>
                                              <span className="font-semibold text-gray-500">#2</span>
                                            </div>
                                          ) : index === 2 ? (
                                            <div className="flex items-center gap-2">
                                              <span className="text-xl">🥉</span>
                                              <span className="font-semibold text-gray-500">#3</span>
                                            </div>
                                          ) : (
                                            <span className="font-semibold text-gray-600">#{index + 1}</span>
                                          )}
                                        </td>
                                        <td className="py-3 px-4">
                                          <span className="font-medium text-gray-900">
                                            {bid.user?.first_name} {bid.user?.last_name}
                                          </span>
                                        </td>
                                        <td className="py-3 px-4">
                                          <span className="text-gray-600">@{bid.user?.username}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                          <div className="text-sm text-gray-600">
                                            <div>{bid.user?.email}</div>
                                            <div>{bid.user?.phone_number}</div>
                                          </div>
                                        </td>
                                        <td className="py-3 px-4">
                                          <span className="text-gray-600">{bid.user?.age || 'N/A'}</span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                          <span className={`font-bold text-xl ${
                                            index === 0 ? 'text-green-600' :
                                            index === 1 ? 'text-blue-600' :
                                            index === 2 ? 'text-orange-600' :
                                            'text-gray-900'
                                          }`}>
                                            {formatCurrency(bid.pledge_amount)}
                                          </span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                            Valid Bid
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-center py-12">
                                <div className="text-6xl mb-4">📝</div>
                                <p className="text-gray-500 text-lg">No bids placed in this round yet</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </>
              );
            })()}

            {(!product.rounds || product.rounds.length === 0) && (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Rounds Created Yet</h3>
                <p className="text-gray-600">Create your first auction round to start accepting bids</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Revenue Summary</h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-600">
                <p className="text-sm text-gray-600 uppercase font-semibold">Entry Fee</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {formatCurrency(product.participation_fee)}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-600">
                <p className="text-sm text-gray-600 uppercase font-semibold">Participants</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {product.participant_count || 0}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-6 border-l-4 border-purple-600">
                <p className="text-sm text-gray-600 uppercase font-semibold">Total Revenue</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {formatCurrency((product.participation_fee || 0) * (product.participant_count || 0))}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Buy Now Tabs */}
        {activeTab === 'buyers' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center mb-4">
              <Link
                to={`/management/products/${id}/buyers`}
                className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700"
              >
                View All Buyers & Orders →
              </Link>
            </div>
            <p className="text-gray-600 text-center">
              See all customers who purchased this product with full order details
            </p>
          </div>
        )}

        {/* Auction Rounds Tab */}
        {activeTab === 'rounds' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Auction Rounds</h2>
              <button
                onClick={() => navigate(`/management/products/${id}/create-next-round`)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 shadow-lg transition transform hover:scale-105"
              >
                ➕ Create Next Round
              </button>
            </div>

            {/* Overall Rounds Summary */}
            {product.rounds?.length > 0 && (
              <div className="bg-gradient-to-br from-blue-600 to-cyan-700 rounded-xl shadow-2xl p-6 text-white mb-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <span>🏁</span> Rounds Overview
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <p className="text-blue-100 text-sm font-semibold mb-1">Total Rounds</p>
                    <p className="text-4xl font-bold">{product.rounds.length}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <p className="text-blue-100 text-sm font-semibold mb-1">Active Round</p>
                    <p className="text-4xl font-bold">
                      {product.rounds.find(r => r.is_active)?.round_number || '-'}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <p className="text-blue-100 text-sm font-semibold mb-1">Total Participants</p>
                    <p className="text-4xl font-bold">
                      {product.rounds.reduce((sum, r) => sum + (r.participant_count || 0), 0)}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <p className="text-blue-100 text-sm font-semibold mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold">
                      {formatCurrency(
                        product.rounds.reduce((sum, r) =>
                          sum + ((r.participation_fee || 0) * (r.participant_count || 0)), 0
                        )
                      )}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <p className="text-blue-100 text-sm font-semibold mb-1">Total Bids</p>
                    <p className="text-4xl font-bold">
                      {product.rounds.reduce((sum, r) => sum + (r.bid_count || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Rounds Timeline */}
            {product.rounds?.length > 0 ? (
              <div className="space-y-4">
                {product.rounds
                  .sort((a, b) => b.round_number - a.round_number)
                  .map((round, index) => {
                    const highestPledge = round.participants?.length > 0
                      ? Math.max(...round.participants.map(p => p.pledge_amount || 0))
                      : 0;

                    return (
                      <Link
                        key={round.id}
                        to={`/management/products/${id}/rounds/${round.id}`}
                        className="block bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-l-8 hover:scale-[1.02] group"
                        style={{
                          borderLeftColor: round.is_active ? '#10b981' : index === 0 ? '#3b82f6' : '#6b7280'
                        }}
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between">
                            {/* Left: Round Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="text-3xl font-bold text-gray-900">
                                  Round {round.round_number}
                                </h3>
                                {round.is_active ? (
                                  <span className="px-4 py-1 bg-green-500 text-white rounded-full text-sm font-bold animate-pulse">
                                    LIVE
                                  </span>
                                ) : (
                                  <span className="px-4 py-1 bg-gray-400 text-white rounded-full text-sm font-bold">
                                    CLOSED
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Entry Fee</p>
                                  <p className="text-lg font-bold text-orange-600">
                                    {formatCurrency(round.participation_fee)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Pledge Range</p>
                                  <p className="text-sm font-semibold text-gray-700">
                                    {formatCurrency(round.min_pledge)} - {formatCurrency(round.max_pledge)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Participants</p>
                                  <p className="text-lg font-bold text-blue-600">
                                    {round.participant_count || 0}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Bids</p>
                                  <p className="text-lg font-bold text-purple-600">
                                    {round.bid_count || 0}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-6 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400">📅</span>
                                  <span>Started: {new Date(round.start_time).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400">⏰</span>
                                  <span>Ends: {new Date(round.end_time).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>

                            {/* Right: Stats Card */}
                            <div className="ml-6 text-right">
                              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200 min-w-[160px]">
                                <p className="text-xs text-green-700 font-semibold mb-1">Highest Pledge</p>
                                <p className="text-2xl font-bold text-green-600">
                                  {highestPledge > 0 ? formatCurrency(highestPledge) : 'No bids'}
                                </p>
                              </div>
                              <div className="mt-3 bg-blue-50 rounded-lg p-3 border border-blue-200">
                                <p className="text-xs text-blue-700 font-semibold mb-1">Revenue</p>
                                <p className="text-lg font-bold text-blue-600">
                                  {formatCurrency((round.participation_fee || 0) * (round.participant_count || 0))}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* View Details Button */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-end text-blue-600 font-semibold group-hover:text-blue-700">
                              <span>View Full Details</span>
                              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">🏁</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Rounds Created Yet</h3>
                <p className="text-gray-600 mb-6">Create your first auction round to start accepting participants</p>
                <button
                  onClick={() => navigate(`/management/products/${id}/create-next-round`)}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
                >
                  ➕ Create First Round
                </button>
              </div>
            )}
          </div>
        )}



        {activeTab === 'sales' && (
          <SalesStatsTab productId={id} />
        )}
      </div>

      {/* Range Setting Modal */}
      <SetRangeModal
        isOpen={showRangeModal}
        onClose={() => setShowRangeModal(false)}
        auction={product}
        onActivate={handleActivateWithRange}
      />
    </ManagementLayout>
  );
}