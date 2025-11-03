import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import axios from '../../api/axios';
import { formatCurrency } from '../../utils/helpers';
import ManagementLayout from '../../components/layout/ManagementLayout';

export default function OrderManagementPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, paid, processing, shipped, delivered
  const [paymentFilter, setPaymentFilter] = useState('all'); // all, pending_payment, paid, failed
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Fetch all orders with items and payment info
  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders', statusFilter, paymentFilter],
    queryFn: async () => {
      const response = await axios.get('/orders/');
      return response.data?.results || response.data || [];
    },
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }) =>
      axios.patch(`/orders/${orderId}/`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-orders']);
    },
  });

  // Filter orders based on status, payment, and search
  const filteredOrders = ordersData?.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.payment_status === paymentFilter;
    const matchesSearch = !searchTerm ||
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shipping_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shipping_phone?.includes(searchTerm);

    return matchesStatus && matchesPayment && matchesSearch;
  }) || [];

  // Calculate statistics
  const stats = {
    total: ordersData?.length || 0,
    pending: ordersData?.filter(o => o.status === 'pending').length || 0,
    processing: ordersData?.filter(o => o.status === 'processing').length || 0,
    shipped: ordersData?.filter(o => o.status === 'shipped').length || 0,
    delivered: ordersData?.filter(o => o.status === 'delivered').length || 0,
    totalRevenue: ordersData?.filter(o => o.payment_status === 'paid')
      .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0) || 0,
    paidOrders: ordersData?.filter(o => o.payment_status === 'paid').length || 0,
    pendingPayment: ordersData?.filter(o => o.payment_status === 'pending_payment').length || 0,
  };

  const handleStatusUpdate = (orderId, newStatus) => {
    if (confirm(`Update order status to "${newStatus}"?`)) {
      updateStatusMutation.mutate({ orderId, status: newStatus });
    }
  };

  if (isLoading) {
    return (
      <ManagementLayout>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        </div>
      </ManagementLayout>
    );
  }

  return (
    <ManagementLayout>
      <div>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
              <p className="text-gray-600 mt-1">Track and manage all orders and payments</p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              Refresh
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600 mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow-sm p-4">
              <p className="text-sm text-yellow-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
            </div>
            <div className="bg-blue-50 rounded-lg shadow-sm p-4">
              <p className="text-sm text-blue-600 mb-1">Processing</p>
              <p className="text-2xl font-bold text-blue-700">{stats.processing}</p>
            </div>
            <div className="bg-purple-50 rounded-lg shadow-sm p-4">
              <p className="text-sm text-purple-600 mb-1">Shipped</p>
              <p className="text-2xl font-bold text-purple-700">{stats.shipped}</p>
            </div>
            <div className="bg-green-50 rounded-lg shadow-sm p-4">
              <p className="text-sm text-green-600 mb-1">Delivered</p>
              <p className="text-2xl font-bold text-green-700">{stats.delivered}</p>
            </div>
            <div className="bg-orange-50 rounded-lg shadow-sm p-4">
              <p className="text-sm text-orange-600 mb-1">Total Revenue</p>
              <p className="text-xl font-bold text-orange-700">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>

          {/* Payment Statistics */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg shadow-sm p-4">
              <p className="text-sm text-green-600 mb-1">Paid Orders</p>
              <p className="text-2xl font-bold text-green-700">{stats.paidOrders}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow-sm p-4">
              <p className="text-sm text-yellow-600 mb-1">Pending Payment</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.pendingPayment}</p>
            </div>
            <div className="bg-red-50 rounded-lg shadow-sm p-4">
              <p className="text-sm text-red-600 mb-1">Failed Payment</p>
              <p className="text-2xl font-bold text-red-700">
                {ordersData?.filter(o => o.payment_status === 'failed').length || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Order Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Order Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Status</label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Payments</option>
                <option value="pending_payment">Pending Payment</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Order #, Customer, Phone..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 mb-2">No orders found</p>
              <p className="text-sm text-gray-400">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Order #</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Items</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Payment</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Order Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const isExpanded = expandedOrder === order.id;
                    const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

                    return (
                      <>
                        <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <button
                              onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                              className="font-semibold text-blue-600 hover:underline flex items-center gap-2"
                            >
                              <span>{isExpanded ? '▼' : '▶'}</span>
                              {order.order_number}
                            </button>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{order.shipping_name || order.user?.username}</p>
                              <p className="text-xs text-gray-500">{order.user?.email}</p>
                              <p className="text-xs text-gray-500">{order.shipping_phone}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <p className="text-sm text-gray-700">
                                {order.items?.length > 1
                                  ? `${order.items.length} items`
                                  : order.items?.[0]?.product_title || 'Product'}
                              </p>
                              <p className="text-xs text-gray-500">Qty: {totalItems}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="font-bold text-lg text-gray-900">
                              {formatCurrency(order.total_amount)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                order.payment_status === 'paid'
                                  ? 'bg-green-100 text-green-700'
                                  : order.payment_status === 'pending_payment'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : order.payment_status === 'failed'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {order.payment_status?.replace('_', ' ') || 'pending'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold border-0 ${
                                order.status === 'delivered'
                                  ? 'bg-green-100 text-green-700'
                                  : order.status === 'shipped'
                                  ? 'bg-purple-100 text-purple-700'
                                  : order.status === 'processing'
                                  ? 'bg-blue-100 text-blue-700'
                                  : order.status === 'cancelled'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <p className="text-sm text-gray-700">
                                {new Date(order.created_at).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(order.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Link
                              to={`/management/orders/${order.id}`}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>

                        {/* Expanded Order Details */}
                        {isExpanded && (
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <td colSpan="8" className="py-4 px-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Order Items */}
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                                  <div className="space-y-2">
                                    {order.items?.map((item) => (
                                      <div
                                        key={item.id}
                                        className="flex justify-between items-start bg-white p-3 rounded-lg"
                                      >
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
                                  </div>

                                  {/* Order Summary */}
                                  <div className="mt-4 bg-white p-3 rounded-lg space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">Subtotal:</span>
                                      <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">Shipping:</span>
                                      <span className="font-medium">{formatCurrency(order.shipping_fee)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold border-t pt-2">
                                      <span>Total:</span>
                                      <span className="text-orange-600">{formatCurrency(order.total_amount)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Shipping & Payment Info */}
                                <div className="space-y-4">
                                  {/* Shipping Information */}
                                  <div className="bg-white p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 mb-3">Shipping Information</h4>
                                    <div className="space-y-2 text-sm">
                                      <div>
                                        <span className="text-gray-600">Name:</span>
                                        <span className="ml-2 text-gray-900">{order.shipping_name}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Address:</span>
                                        <span className="ml-2 text-gray-900">{order.shipping_address}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">City:</span>
                                        <span className="ml-2 text-gray-900">{order.shipping_city}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Phone:</span>
                                        <span className="ml-2 text-gray-900">{order.shipping_phone}</span>
                                      </div>
                                      {order.customer_notes && (
                                        <div>
                                          <span className="text-gray-600">Notes:</span>
                                          <p className="text-gray-900 mt-1">{order.customer_notes}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Payment Information */}
                                  <div className="bg-white p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 mb-3">Payment Information</h4>
                                    <div className="space-y-2 text-sm">
                                      <div>
                                        <span className="text-gray-600">Method:</span>
                                        <span className="ml-2 text-gray-900">{order.payment_method || 'M-Pesa'}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Status:</span>
                                        <span className="ml-2 font-medium">
                                          <span
                                            className={`px-2 py-1 rounded ${
                                              order.payment_status === 'paid'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                            }`}
                                          >
                                            {order.payment_status?.replace('_', ' ') || 'pending'}
                                          </span>
                                        </span>
                                      </div>
                                      {order.mpesa_receipt_number && (
                                        <div>
                                          <span className="text-gray-600">M-Pesa Receipt:</span>
                                          <span className="ml-2 text-gray-900 font-mono text-xs">
                                            {order.mpesa_receipt_number}
                                          </span>
                                        </div>
                                      )}
                                      {order.paid_at && (
                                        <div>
                                          <span className="text-gray-600">Paid At:</span>
                                          <span className="ml-2 text-gray-900">
                                            {new Date(order.paid_at).toLocaleString()}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
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
          )}
        </div>

        {/* Results count */}
        <div className="mt-4 text-center text-sm text-gray-600">
          Showing {filteredOrders.length} of {stats.total} orders
        </div>
      </div>
    </ManagementLayout>
  );
}
