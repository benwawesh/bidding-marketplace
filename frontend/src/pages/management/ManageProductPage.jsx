import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ManagementLayout from '../../components/layout/ManagementLayout';
import { auctionsAPI } from '../../api/endpoints';
import { formatCurrency, getTimeRemaining, isAuctionActive } from '../../utils/helpers';
import axios from '../../api/axios';
import SetRangeModal from '../../components/modals/SetRangeModal';

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
        `http://127.0.0.1:8000/api/auctions/${id}/activate/`,
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
      const response = await axios.post(
        `http://127.0.0.1:8000/api/auctions/${id}/close/`,
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
      alert(`✅ ${data.message}\nWinner: ${data.winner.username}\nAmount: ${formatCurrency(data.winner.amount)}`);
      queryClient.invalidateQueries(['product', id]);
    },
    onError: (error) => {
      alert('Failed to close: ' + (error.response?.data?.error || error.message));
    },
  });

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
            <Link
              to={`/management/products/${id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ✏️ Edit
            </Link>
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
                  {showAuctionTabs && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Starting Bid</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(product.base_price)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Entry Fee</p>
                        <p className="text-xl font-bold text-orange-600">
                          {formatCurrency(product.participation_fee)}
                        </p>
                      </div>

                      {product.status === 'active' && (
                        <>
                          <div className="border-t pt-4">
                            <p className="text-sm text-gray-600">Current Highest Bid</p>
                            <p className="text-2xl font-bold text-red-600">
                              {product.highest_bid
                                ? formatCurrency(product.highest_bid.amount)
                                : 'No bids yet'}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-600">Participants</p>
                            <p className="text-xl font-bold text-gray-900">
                              {product.participant_count || 0}
                            </p>
                          </div>
                        </>
                      )}

                      {product.status === 'closed' && product.winner_info && (
                        <div className="border-t pt-4">
                          <p className="text-sm text-gray-600 mb-2">🏆 Winner</p>
                          <p className="text-lg font-bold text-green-600">
                            {product.winner_info.username}
                          </p>
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(product.winning_amount)}
                          </p>
                        </div>
                      )}
                    </>
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

        {/* Auction Tabs */}
        {activeTab === 'participants' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center mb-4">
              <Link
                to={`/management/auctions/${id}/participants`}
                className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700"
              >
                View Full Participants List →
              </Link>
            </div>
            <p className="text-gray-600 text-center">
              See all users who paid the entry fee with full contact details
            </p>
          </div>
        )}

        {activeTab === 'bids' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center mb-4">
              <Link
                to={`/management/auctions/${id}/bids`}
                className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700"
              >
                View All Bids →
              </Link>
            </div>
            <p className="text-gray-600 text-center">
              See complete ranking of all pledges with user details
            </p>
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
