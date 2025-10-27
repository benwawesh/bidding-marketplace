import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ManagementLayout from '../../components/layout/ManagementLayout';
import { ordersAPI } from '../../api/endpoints';
import { formatCurrency } from '../../utils/helpers';

export default function OrdersListPage() {
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch all orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => ordersAPI.getAll().then(res => res.data),
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['order-stats'],
    queryFn: () => ordersAPI.getStats().then(res => res.data),
  });

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status === statusFilter);

  if (isLoading) {
    return (
      <ManagementLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </ManagementLayout>
    );
  }

  return (
    <ManagementLayout>
      <div>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders Management</h1>
          <p className="text-gray-600">View and manage customer orders</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-600">
            <p className="text-xs text-gray-600 uppercase font-semibold">Total</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats?.total_orders || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-600">
            <p className="text-xs text-gray-600 uppercase font-semibold">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{stats?.pending || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-600">
            <p className="text-xs text-gray-600 uppercase font-semibold">Paid</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats?.paid || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-600">
            <p className="text-xs text-gray-600 uppercase font-semibold">Processing</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{stats?.processing || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-indigo-600">
            <p className="text-xs text-gray-600 uppercase font-semibold">Shipped</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{stats?.shipped || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-teal-600">
            <p className="text-xs text-gray-600 uppercase font-semibold">Delivered</p>
            <p className="text-2xl font-bold text-teal-600 mt-1">{stats?.delivered || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-600">
            <p className="text-xs text-gray-600 uppercase font-semibold">Revenue</p>
            <p className="text-xl font-bold text-red-600 mt-1">
              {formatCurrency(stats?.total_revenue || 0)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                statusFilter === 'all' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Orders
            </button>
            {['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-semibold transition capitalize ${
                  statusFilter === status 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-600">
                {statusFilter === 'all' 
                  ? 'No orders have been placed yet' 
                  : `No ${statusFilter} orders`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Order #</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Items</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Total</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <span className="font-mono font-semibold text-gray-900">
                          {order.order_number}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-gray-900">{order.shipping_name}</p>
                          <p className="text-sm text-gray-500">{order.customer?.email || order.shipping_phone}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-900">{order.total_items}</td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-green-600">
                          {formatCurrency(order.total_amount)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
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
                      <td className="py-4 px-4">
                        <Link
                          to={`/management/orders/${order.id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ManagementLayout>
  );
}
