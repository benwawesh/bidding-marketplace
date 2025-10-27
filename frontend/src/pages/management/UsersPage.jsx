import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersAPI } from '../../api/endpoints';
import ManagementLayout from '../../components/layout/ManagementLayout';
import { formatCurrency } from '../../utils/helpers';

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch users with filters
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['admin-users', filterType, searchTerm],
    queryFn: () => {
      const params = {};
      if (filterType !== 'all') params.user_type = filterType;
      if (searchTerm) params.search = searchTerm;
      console.log('Fetching users with params:', params);
      return usersAPI.adminList(params).then(res => {
        console.log('Users response:', res.data);
        return res.data;
      });
    },
  });

  console.log('Users data:', users);
  console.log('Loading:', isLoading);
  console.log('Error:', error);

  // Fetch overall stats
  const { data: stats } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: () => usersAPI.adminStats().then(res => res.data),
  });

  // Fetch user details when modal opens
  const { data: userDetails } = useQuery({
    queryKey: ['admin-user-detail', selectedUser?.id],
    queryFn: () => usersAPI.adminDetail(selectedUser.id).then(res => res.data),
    enabled: !!selectedUser,
  });

  const openUserModal = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <ManagementLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </ManagementLayout>
    );
  }

  return (
    <ManagementLayout>
      <div>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Users Management</h1>
          <p className="text-gray-600">Manage all platform users</p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600">
                <p className="text-sm text-gray-600 uppercase font-semibold">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_users}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-600">
                <p className="text-sm text-gray-600 uppercase font-semibold">Verified</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.verified}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-600">
                <p className="text-sm text-gray-600 uppercase font-semibold">New (30d)</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.new_users_last_30_days}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-600">
                <p className="text-sm text-gray-600 uppercase font-semibold">👤 Buyers</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.buyers}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-600">
                <p className="text-sm text-gray-600 uppercase font-semibold">🏪 Sellers</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.sellers}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-600">
                <p className="text-sm text-gray-600 uppercase font-semibold">👑 Admins</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.admins || 0}</p>
              </div>
            </div>
          </>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Filter Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filterType === 'all'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Users
              </button>
              <button
                onClick={() => setFilterType('buyer')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filterType === 'buyer'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Buyers
              </button>
              <button
                onClick={() => setFilterType('seller')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filterType === 'seller'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Sellers
              </button>
              <button
                onClick={() => setFilterType('admin')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filterType === 'admin'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Admins
              </button>
            </div>

            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by username, email, phone, or name..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">User</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Contact</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Type</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Stats</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Joined</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <p className="text-gray-500">No users found</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-semibold text-gray-900">{user.username}</p>
                        <p className="text-sm text-gray-500">
                          {user.first_name} {user.last_name}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm">
                        <p className="text-gray-900">{user.email}</p>
                        <p className="text-gray-500">{user.phone_number || '—'}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.user_type === 'admin'
                          ? 'bg-red-100 text-red-700'
                          : user.user_type === 'buyer'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {user.user_type === 'admin' ? '👑 Admin' : 
                         user.user_type === 'buyer' ? 'Buyer' : 'Seller'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm">
                        <p className="text-gray-900">
                          Won: <span className="font-semibold">{user.auctions_won}</span>
                        </p>
                        <p className="text-gray-600">
                          Spent: {formatCurrency(user.total_spent)}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          user.is_verified
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {user.is_verified ? '✓ Verified' : '⚠ Unverified'}
                        </span>
                        <span className="text-xs text-gray-600">
                          Trust: {user.trust_score}/100
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-gray-600">
                        {new Date(user.date_joined).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => openUserModal(user)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* User Detail Modal */}
        {isModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    User Details: {selectedUser.username}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              {userDetails ? (
                <div className="p-6 space-y-6">
                  {/* User Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">Full Name</p>
                      <p className="text-gray-900">{selectedUser.first_name} {selectedUser.last_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">Email</p>
                      <p className="text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">Phone</p>
                      <p className="text-gray-900">{selectedUser.phone_number || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">User Type</p>
                      <p className="text-gray-900 capitalize">{selectedUser.user_type}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-bold mb-4">Statistics</h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Total Orders</p>
                        <p className="text-2xl font-bold text-blue-600">{userDetails.stats.total_orders}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Total Spent</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(userDetails.stats.total_spent)}
                        </p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Total Bids</p>
                        <p className="text-2xl font-bold text-purple-600">{userDetails.stats.total_bids}</p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Participations</p>
                        <p className="text-2xl font-bold text-yellow-600">{userDetails.stats.total_participations}</p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Orders */}
                  {userDetails.recent_orders.length > 0 && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-bold mb-4">Recent Orders</h3>
                      <div className="space-y-2">
                        {userDetails.recent_orders.map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div>
                              <p className="font-semibold">{order.order_number}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatCurrency(order.total_amount)}</p>
                              <span className={`text-xs px-2 py-1 rounded ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Bids */}
                  {userDetails.recent_bids.length > 0 && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-bold mb-4">Recent Bids</h3>
                      <div className="space-y-2">
                        {userDetails.recent_bids.map((bid) => (
                          <div key={bid.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div>
                              <p className="font-semibold">{bid.auction_title}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(bid.submitted_at).toLocaleDateString()}
                              </p>
                            </div>
                            <p className="font-semibold text-red-600">{formatCurrency(bid.pledge_amount)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading user details...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ManagementLayout>
  );
}
