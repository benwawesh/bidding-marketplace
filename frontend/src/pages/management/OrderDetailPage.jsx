import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ManagementLayout from '../../components/layout/ManagementLayout';
import { ordersAPI } from '../../api/endpoints';
import { formatCurrency } from '../../utils/helpers';

export default function OrderDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  // Fetch order details
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersAPI.getById(id).then(res => res.data),
  });

  // Update status mutation
  const updateMutation = useMutation({
    mutationFn: (data) => ordersAPI.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['order', id]);
      queryClient.invalidateQueries(['admin-orders']);
      alert('✅ Order status updated successfully!');
      setNewStatus('');
    },
    onError: (error) => {
      alert('❌ Failed to update: ' + (error.response?.data?.error || error.message));
    },
  });

  const handleUpdateStatus = () => {
    if (!newStatus) {
      alert('Please select a status');
      return;
    }
    updateMutation.mutate({ status: newStatus, admin_notes: adminNotes });
  };

  if (isLoading) {
    return (
      <ManagementLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order...</p>
        </div>
      </ManagementLayout>
    );
  }

  if (!order) {
    return (
      <ManagementLayout>
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 mb-4">Order not found</p>
          <Link to="/management/orders" className="text-red-600 hover:underline">
            Back to Orders
          </Link>
        </div>
      </ManagementLayout>
    );
  }

  return (
    <ManagementLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link to="/management/orders" className="text-red-600 hover:underline mb-2 inline-block">
            ← Back to Orders
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order {order.order_number}</h1>
              <p className="text-gray-600">Placed on {new Date(order.created_at).toLocaleString()}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-bold ${
              order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              order.status === 'paid' ? 'bg-green-100 text-green-700' :
              order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
              order.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
              order.status === 'delivered' ? 'bg-teal-100 text-teal-700' :
              'bg-red-100 text-red-700'
            }`}>
              {order.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-gray-900">{order.shipping_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-900">{order.shipping_phone}</p>
                </div>
                {order.customer && (
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">{order.customer.email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Address</h2>
              <p className="text-gray-900">{order.shipping_address}</p>
              <p className="text-gray-900">{order.shipping_city}</p>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items ({order.total_items})</h2>
              <div className="space-y-4">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-4">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{item.product_title}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(item.total_price)}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(item.product_price)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {order.customer_notes && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Notes</h2>
                <p className="text-gray-700">{order.customer_notes}</p>
              </div>
            )}
          </div>

          {/* Right Column - Actions & Summary */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold">{formatCurrency(order.shipping_fee)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-green-600 text-xl">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Payment</h2>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Method</p>
                  <p className="font-semibold text-gray-900 capitalize">{order.payment_method}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className={`font-semibold ${
                    order.payment_status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {order.payment_status}
                  </p>
                </div>
                {order.mpesa_transaction_id && (
                  <div>
                    <p className="text-sm text-gray-600">Transaction ID</p>
                    <p className="font-mono text-xs text-gray-900">{order.mpesa_transaction_id}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Update Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Update Status</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">New Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Select status...</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Internal notes..."
                  />
                </div>
                <button
                  onClick={handleUpdateStatus}
                  disabled={updateMutation.isPending || !newStatus}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {updateMutation.isPending ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ManagementLayout>
  );
}
