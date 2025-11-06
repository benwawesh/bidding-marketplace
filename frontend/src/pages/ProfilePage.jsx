import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { usersAPI, ordersAPI, bidsAPI } from '../api/endpoints';
import { formatCurrency } from '../utils/helpers';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch user details
  const { data: userDetails, isLoading: loadingUser } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: usersAPI.getMe,
  });

  // Fetch orders
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersAPI.getAll().then(res => res.data?.results || res.data || []),
    enabled: activeTab === 'orders',
  });

  // Fetch bids
  const { data: bids = [], isLoading: loadingBids } = useQuery({
    queryKey: ['bids'],
    queryFn: () => bidsAPI.getMyBids().then(res => res.data?.results || res.data || []),
    enabled: activeTab === 'bids',
  });

  const userData = userDetails?.data;

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-3xl font-bold">
                {userData?.first_name?.[0] || userData?.username?.[0] || 'U'}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {userData?.first_name && userData?.last_name 
                    ? `${userData.first_name} ${userData.last_name}`
                    : userData?.username}
                </h1>
                <p className="text-gray-600">@{userData?.username}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    userData?.user_type === 'admin' ? 'bg-purple-100 text-purple-700' :
                    userData?.user_type === 'seller' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {userData?.user_type?.toUpperCase()}
                  </span>
                  {userData?.is_verified && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      ✓ Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link
              to="/profile/edit"
              className="px-6 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition"
            >
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">Auctions Won</div>
            <div className="text-2xl font-bold text-orange-600">
              {userData?.auctions_won || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">Participated</div>
            <div className="text-2xl font-bold text-blue-600">
              {userData?.auctions_participated || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">Total Spent</div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(userData?.total_spent || 0)}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 font-semibold border-b-2 transition ${
                  activeTab === 'overview'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-4 font-semibold border-b-2 transition ${
                  activeTab === 'orders'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Purchase History
              </button>
              <button
                onClick={() => setActiveTab('bids')}
                className={`px-6 py-4 font-semibold border-b-2 transition ${
                  activeTab === 'bids'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Bidding History
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Username</div>
                    <div className="text-lg font-semibold text-gray-900">{userData?.username}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Email</div>
                    <div className="text-lg font-semibold text-gray-900">{userData?.email}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">First Name</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {userData?.first_name || 'Not provided'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Last Name</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {userData?.last_name || 'Not provided'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Phone Number</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {userData?.phone_number || 'Not provided'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Gender</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {userData?.gender 
                        ? userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1)
                        : 'Not provided'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Age</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {userData?.date_of_birth 
                        ? (() => {
                            const today = new Date();
                            const birthDate = new Date(userData.date_of_birth);
                            let age = today.getFullYear() - birthDate.getFullYear();
                            const monthDiff = today.getMonth() - birthDate.getMonth();
                            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                              age--;
                            }
                            return `${age} years`;
                          })()
                        : 'Not provided'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Member Since</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {userData?.date_joined
                        ? new Date(userData.date_joined).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })
                        : 'Unknown'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Purchase History Tab */}
            {activeTab === 'orders' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Purchase History</h3>
                {loadingOrders ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600 mx-auto"></div>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                    </svg>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Orders Yet</h3>
                    <p className="text-gray-600 mb-4">You haven't made any purchases yet.</p>
                    <Link to="/browse" className="inline-block bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-700">
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.filter(order => order.payment_status !== 'pending').map(order => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-bold text-gray-900">Order #{order.order_number}</div>
                            <div className="text-sm text-gray-600">
                              {new Date(order.created_at).toLocaleString('en-US', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: false
                              })}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-orange-600">
                              {formatCurrency(order.total_amount)}
                            </div>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                              order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                              order.status === 'paid' ? 'bg-purple-100 text-purple-700' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {order.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        {order.items && (
                          <div className="space-y-2 pt-3 border-t">
                            {order.items.map(item => (
                              <div key={item.id} className="flex items-center gap-3 text-sm">
                                <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0">
                                  {item.product?.main_image && (
                                    <img src={item.product.main_image} alt="" className="w-full h-full object-cover rounded" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{item.product?.title || 'Product'}</div>
                                  <div className="text-gray-600">Qty: {item.quantity} × {formatCurrency(item.product_price)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bidding History Tab */}
            {activeTab === 'bids' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Bidding History</h3>
                {loadingBids ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600 mx-auto"></div>
                  </div>
                ) : bids.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Bids Yet</h3>
                    <p className="text-gray-600 mb-4">You haven't participated in any auctions yet.</p>
                    <Link to="/browse" className="inline-block bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-700">
                      Browse Auctions
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bids.map(bid => (
                      <div key={bid.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Link 
                              to={`/auction/${bid.auction?.id}`}
                              className="font-bold text-gray-900 hover:text-orange-600"
                            >
                              {bid.auction?.title || 'Auction'}
                            </Link>
                            <div className="text-sm text-gray-600 mt-1">
                              Bid placed: {new Date(bid.submitted_at).toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600">
                              Round {bid.round?.round_number || 1}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-orange-600">
                              {formatCurrency(bid.pledge_amount)}
                            </div>
                            {bid.is_winner && (
                              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 mt-2">
                                🏆 WINNER
                              </span>
                            )}
                            {bid.is_valid ? (
                              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 mt-2">
                                ✓ Valid
                              </span>
                            ) : (
                              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 mt-2">
                                ✗ Invalid
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
