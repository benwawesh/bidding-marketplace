// src/pages/UserDashboard.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getMyBids } from '../api/bidAPI';
import axios from '../api/axios';
import { formatCurrency } from '../utils/helpers';

export default function UserDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Fetch user's bidding history
  const { data: biddingData, isLoading: biddingLoading, error: biddingError } = useQuery({
    queryKey: ['user-bidding-history'],
    queryFn: async () => {
      const bids = await getMyBids();
      console.log('Raw bids data from API:', bids);

      // Fetch auction details for each unique auction
      const uniqueAuctionIds = [...new Set(bids.map(b => b.auction))];
      console.log('Unique auction IDs:', uniqueAuctionIds);

      const auctionPromises = uniqueAuctionIds.map(id =>
        axios.get(`/auctions/${id}/`).then(res => res.data).catch(err => {
          console.error(`Failed to fetch auction ${id}:`, err);
          return null;
        })
      );

      const auctions = await Promise.all(auctionPromises);
      const auctionsMap = {};
      auctions.forEach(auction => {
        if (auction) {
          auctionsMap[auction.id] = auction;
        }
      });

      // Merge auction info into bids
      const bidsWithAuctionInfo = bids.map(bid => ({
        ...bid,
        auction_info: auctionsMap[bid.auction] ? {
          id: auctionsMap[bid.auction].id,
          title: auctionsMap[bid.auction].title,
          status: auctionsMap[bid.auction].status,
        } : null
      }));

      console.log('Bids with auction info:', bidsWithAuctionInfo);
      return bidsWithAuctionInfo;
    },
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache
  });

  // Fetch user's participations (rounds joined)
  const { data: participationsData, isLoading: participationsLoading, error: participationsError } = useQuery({
    queryKey: ['user-participations'],
    queryFn: async () => {
      const res = await axios.get('/participations/my_participations/');
      return res.data?.results || res.data || [];
    },
  });

  // Fetch user's purchase history
  const { data: purchasesData, isLoading: purchasesLoading, error: purchasesError } = useQuery({
    queryKey: ['user-purchases'],
    queryFn: async () => {
      try {
        const res = await axios.get('/orders/');
        return res.data?.results || res.data || [];
      } catch (error) {
        // Return empty array if orders endpoint doesn't exist (404)
        if (error.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
  });

  const bids = biddingData || [];
  const participations = participationsData || [];
  // Only show orders that have been paid (exclude pending payment orders)
  const purchases = (purchasesData || []).filter(order => order.payment_status !== 'pending');

  // DEBUG: Check what data we're receiving
  if (bids.length > 0) {
    console.log('First bid from API:', bids[0]);
    console.log('Has auction_info?', !!bids[0].auction_info);
    console.log('auction_info content:', bids[0].auction_info);
  }

  // Group bids by auction
  const bidsByAuction = bids.reduce((acc, bid) => {
    // Use auction_info if available, otherwise fall back to auction UUID
    const auctionId = bid.auction_info?.id || bid.auction;
    const auctionTitle = bid.auction_info?.title || 'Unknown Auction';
    const auctionStatus = bid.auction_info?.status || 'unknown';

    if (!auctionId) {
      console.warn('⚠️ Bid without auction ID:', bid);
      return acc;
    }

    if (!acc[auctionId]) {
      acc[auctionId] = {
        auctionId: auctionId,
        auctionTitle: auctionTitle,
        auctionStatus: auctionStatus,
        bids: []
      };
    }
    acc[auctionId].bids.push(bid);
    return acc;
  }, {});

  // Calculate detailed stats for each auction
  const auctionStats = Object.values(bidsByAuction).map(({ auctionId, auctionTitle, auctionStatus, bids }) => {
    const roundsParticipated = [...new Set(bids.map(b => b.round_number || b.round_info?.round_number))].length;
    const totalPledged = bids.reduce((sum, bid) => sum + parseFloat(bid.pledge_amount || 0), 0);
    const averagePledge = totalPledged / bids.length;
    const highestPledge = Math.max(...bids.map(b => parseFloat(b.pledge_amount || 0)));
    const lowestPledge = Math.min(...bids.map(b => parseFloat(b.pledge_amount || 0)));

    // Group bids by round
    const bidsByRound = bids.reduce((acc, bid) => {
      const roundNum = bid.round_number || bid.round_info?.round_number || 'Unknown';
      if (!acc[roundNum]) acc[roundNum] = [];
      acc[roundNum].push(bid);
      return acc;
    }, {});

    return {
      auction: {
        id: auctionId,
        title: auctionTitle,
        status: auctionStatus
      },
      bids,
      roundsParticipated,
      totalPledged,
      averagePledge,
      highestPledge,
      lowestPledge,
      bidsByRound
    };
  });

  // Calculate overall stats
  const totalBids = bids.length;
  const totalPurchases = purchases.length;
  const totalSpent = purchases.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);

  if (biddingLoading || participationsLoading || purchasesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show errors if any
  if (biddingError || participationsError || purchasesError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">
            {biddingError?.message || participationsError?.message || purchasesError?.message || 'Failed to load data'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header with User Profile */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {user?.first_name} {user?.last_name}
                </h1>
                <div className="space-y-1 text-gray-600">
                  <p className="flex items-center gap-2">
                    <span className="font-semibold">👤 Username:</span>
                    <span>@{user?.username}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-semibold">📧 Email:</span>
                    <span>{user?.email}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-semibold">📞 Phone:</span>
                    <span>{user?.phone_number || 'Not provided'}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-semibold">🎂 Age:</span>
                    <span>{user?.age || 'Not provided'}</span>
                  </p>
                </div>
              </div>
            </div>
            <Link
              to="/profile"
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold"
            >
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">🎯</span>
              <span className="text-blue-100 text-sm font-semibold">YOUR BIDS</span>
            </div>
            <p className="text-4xl font-bold mb-1">{totalBids}</p>
            <p className="text-blue-100 text-sm">Total Bids Placed</p>
            <p className="text-blue-200 text-xs mt-2">{Object.keys(bidsByAuction).length} auctions</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">🛒</span>
              <span className="text-orange-100 text-sm font-semibold">PURCHASES</span>
            </div>
            <p className="text-3xl font-bold mb-1">{formatCurrency(totalSpent)}</p>
            <p className="text-orange-100 text-sm">Total Spent</p>
            <p className="text-orange-200 text-xs mt-2">{totalPurchases} orders</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-t-xl shadow-sm border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 font-semibold border-b-2 transition ${
                activeTab === 'overview'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('bidding')}
              className={`py-4 font-semibold border-b-2 transition ${
                activeTab === 'bidding'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              🎯 Bidding History
            </button>
            <button
              onClick={() => setActiveTab('purchases')}
              className={`py-4 font-semibold border-b-2 transition ${
                activeTab === 'purchases'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              🛒 Purchase History
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-xl shadow-lg p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Overview</h2>

              {/* Auction Summary Cards */}
              {auctionStats.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">Your Auctions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {auctionStats.map((stat) => (
                      <div key={stat.auction.id} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-blue-200">
                        <Link
                          to={`/auction/${stat.auction.id}`}
                          className="text-xl font-bold text-gray-900 hover:text-orange-600 mb-2 block"
                        >
                          {stat.auction.title}
                        </Link>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Rounds Participated</p>
                            <p className="text-2xl font-bold text-blue-600">{stat.roundsParticipated}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Total Bids</p>
                            <p className="text-2xl font-bold text-purple-600">{stat.bids.length}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Average Pledge</p>
                            <p className="text-xl font-bold text-green-600">{formatCurrency(stat.averagePledge)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Total Pledged</p>
                            <p className="text-xl font-bold text-orange-600">{formatCurrency(stat.totalPledged)}</p>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Highest: {formatCurrency(stat.highestPledge)}</span>
                            <span className="text-gray-600">Lowest: {formatCurrency(stat.lowestPledge)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Bidding Activity Yet</h3>
                  <p className="text-gray-600 mb-6">Start bidding on auctions to see your statistics here</p>
                  <Link
                    to="/"
                    className="inline-block bg-orange-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-700"
                  >
                    Browse Auctions
                  </Link>
                </div>
              )}

              {/* Recent Purchases */}
              {purchases.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Purchases</h3>
                  <div className="space-y-3">
                    {purchases.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{order.product_title || 'Product'}</p>
                          <p className="text-sm text-gray-500">Order #{order.order_number}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-blue-600">{formatCurrency(order.total_amount)}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            order.order_status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.order_status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.order_status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bidding History Tab */}
          {activeTab === 'bidding' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">My Bidding History</h2>

              {auctionStats.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200 bg-gray-50">
                        <th className="text-left py-4 px-4 font-semibold text-gray-700">Product / Auction Item</th>
                        <th className="text-center py-4 px-4 font-semibold text-gray-700">Round</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-700">My Pledges</th>
                        <th className="text-right py-4 px-4 font-semibold text-gray-700">Highest Pledge</th>
                        <th className="text-right py-4 px-4 font-semibold text-gray-700">Average</th>
                        <th className="text-center py-4 px-4 font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auctionStats.map((stat) => {
                        // Calculate total average across all rounds for this auction
                        const totalAverage = stat.totalPledged / stat.bids.length;

                        return Object.entries(stat.bidsByRound).map(([roundNum, roundBids], roundIndex) => {
                          // Calculate highest pledge in this round
                          const highestInRound = Math.max(...roundBids.map(b => parseFloat(b.pledge_amount || 0)));
                          // Calculate average for this round
                          const roundAverage = roundBids.reduce((sum, b) => sum + parseFloat(b.pledge_amount || 0), 0) / roundBids.length;

                          return (
                            <tr key={`${stat.auction.id}-${roundNum}`} className="border-b border-gray-100 hover:bg-gray-50">
                              {/* Auction Item - Only show on first round */}
                              {roundIndex === 0 && (
                                <td
                                  className="py-4 px-4 align-top"
                                  rowSpan={Object.keys(stat.bidsByRound).length}
                                >
                                  <Link
                                    to={`/auction/${stat.auction.id}`}
                                    className="font-bold text-blue-600 hover:text-blue-800 text-lg"
                                  >
                                    {stat.auction.title}
                                  </Link>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {stat.roundsParticipated} round(s) • {stat.bids.length} total bids
                                  </p>
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-xs text-gray-600 mb-1">Total Average Pledge:</p>
                                    <p className="text-lg font-bold text-purple-600">{formatCurrency(totalAverage)}</p>
                                  </div>
                                </td>
                              )}

                              {/* Round */}
                              <td className="py-4 px-4 text-center">
                                <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold text-sm">
                                  Round {roundNum}
                                </span>
                              </td>

                              {/* Pledges */}
                              <td className="py-4 px-4">
                                <div className="space-y-2">
                                  {roundBids.map((bid, bidIndex) => (
                                    <div key={bid.id} className="flex items-start gap-2">
                                      <span className="text-xs text-gray-400 font-semibold mt-1">#{bidIndex + 1}.</span>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-green-600 text-base">
                                            {formatCurrency(bid.pledge_amount)}
                                          </span>
                                          <span className="text-gray-400">•</span>
                                          <span className="text-gray-500 text-xs">
                                            {new Date(bid.submitted_at).toLocaleDateString()} {new Date(bid.submitted_at).toLocaleTimeString()}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </td>

                              {/* Highest Pledge in Round */}
                              <td className="py-4 px-4 text-right">
                                <div className="flex flex-col items-end">
                                  <span className="font-bold text-xl text-orange-600">
                                    {formatCurrency(highestInRound)}
                                  </span>
                                  <span className="text-xs text-gray-500 mt-1">
                                    {roundBids.length} {roundBids.length === 1 ? 'bid' : 'bids'}
                                  </span>
                                </div>
                              </td>

                              {/* Round Average */}
                              <td className="py-4 px-4 text-right">
                                <span className="font-bold text-lg text-blue-600">
                                  {formatCurrency(roundAverage)}
                                </span>
                              </td>

                              {/* Status - Only show on first round */}
                              {roundIndex === 0 && (
                                <td
                                  className="py-4 px-4 text-center align-top"
                                  rowSpan={Object.keys(stat.bidsByRound).length}
                                >
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    stat.auction.status === 'active' ? 'bg-green-100 text-green-700' :
                                    stat.auction.status === 'closed' ? 'bg-gray-100 text-gray-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {stat.auction.status?.toUpperCase()}
                                  </span>
                                </td>
                              )}
                            </tr>
                          );
                        });
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Bids Yet</h3>
                  <p className="text-gray-600 mb-6">Start bidding on auctions to see your history here</p>
                  <Link
                    to="/"
                    className="inline-block bg-orange-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-700"
                  >
                    Browse Auctions
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Purchase History Tab */}
          {activeTab === 'purchases' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">My Purchase History</h2>
              {purchases.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Order #</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Product</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Quantity</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.map((order) => {
                        const isExpanded = expandedOrder === order.id;
                        const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

                        return (
                          <>
                            <tr
                              key={order.id}
                              className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                              onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                            >
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">
                                    {isExpanded ? '▼' : '▶'}
                                  </span>
                                  <span className="font-mono font-semibold text-gray-900">
                                    {order.order_number}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <p className="font-semibold text-gray-900">
                                  {order.items?.length > 1
                                    ? `${order.items.length} items`
                                    : order.items?.[0]?.product_title || 'Product'}
                                </p>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className="font-semibold text-gray-900">{totalItems}</span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <span className="font-bold text-lg text-blue-600">
                                  {formatCurrency(order.total_amount)}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                  order.status === 'paid' ? 'bg-green-100 text-green-700' :
                                  order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                  order.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                                  order.status === 'delivered' ? 'bg-teal-100 text-teal-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-gray-600">
                                {new Date(order.created_at).toLocaleDateString()}
                              </td>
                            </tr>

                            {/* Expanded Order Details */}
                            {isExpanded && (
                              <tr key={`${order.id}-details`} className="bg-gray-50">
                                <td colSpan="6" className="py-4 px-8">
                                  <div className="space-y-4">
                                    <h4 className="font-bold text-gray-900 mb-3">Order Details</h4>

                                    {/* Order Items */}
                                    <div className="bg-white rounded-lg p-4 space-y-3">
                                      <p className="font-semibold text-gray-700 mb-2">Items:</p>
                                      {order.items?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                          <div className="flex-1">
                                            <p className="font-medium text-gray-900">{item.product_title}</p>
                                            <p className="text-sm text-gray-600">
                                              {formatCurrency(item.product_price)} × {item.quantity}
                                            </p>
                                          </div>
                                          <p className="font-semibold text-gray-900">
                                            {formatCurrency(item.total_price)}
                                          </p>
                                        </div>
                                      ))}

                                      {/* Order Summary */}
                                      <div className="border-t border-gray-200 pt-3 mt-3 space-y-2">
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-600">Subtotal:</span>
                                          <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                                          <span>Total:</span>
                                          <span className="text-blue-600">{formatCurrency(order.total_amount)}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Shipping Information */}
                                    <div className="bg-white rounded-lg p-4">
                                      <p className="font-semibold text-gray-700 mb-2">Shipping Information:</p>
                                      <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                          <p className="text-gray-600">Name:</p>
                                          <p className="font-medium">{order.shipping_name}</p>
                                        </div>
                                        <div>
                                          <p className="text-gray-600">Phone:</p>
                                          <p className="font-medium">{order.shipping_phone}</p>
                                        </div>
                                        <div className="col-span-2">
                                          <p className="text-gray-600">Address:</p>
                                          <p className="font-medium">{order.shipping_address}, {order.shipping_city}</p>
                                        </div>
                                        {order.customer_notes && (
                                          <div className="col-span-2">
                                            <p className="text-gray-600">Notes:</p>
                                            <p className="font-medium">{order.customer_notes}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Payment Info */}
                                    {order.paid_at && (
                                      <div className="bg-white rounded-lg p-4">
                                        <p className="font-semibold text-gray-700 mb-2">Payment:</p>
                                        <p className="text-sm">
                                          <span className="text-gray-600">Paid on: </span>
                                          <span className="font-medium">
                                            {new Date(order.paid_at).toLocaleString()}
                                          </span>
                                        </p>
                                        <p className="text-sm">
                                          <span className="text-gray-600">Status: </span>
                                          <span className={`font-medium ${order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                                            {order.payment_status}
                                          </span>
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🛒</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Purchases Yet</h3>
                  <p className="text-gray-600 mb-6">Browse our buy now products to make your first purchase</p>
                  <Link
                    to="/"
                    className="inline-block bg-orange-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-700"
                  >
                    Shop Now
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
