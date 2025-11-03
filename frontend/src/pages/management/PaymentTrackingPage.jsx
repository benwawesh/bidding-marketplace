import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import axios from '../../api/axios';
import { formatCurrency } from '../../utils/helpers';

export default function PaymentTrackingPage() {
  const [filter, setFilter] = useState('all'); // all, completed, pending, failed
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all M-Pesa transactions
  const { data: transactions, isLoading, refetch } = useQuery({
    queryKey: ['admin-payments', filter],
    queryFn: async () => {
      const response = await axios.get('/payments/mpesa/admin-transactions/');
      return response.data?.results || response.data || [];
    },
  });

  // Filter transactions based on status and search
  const filteredTransactions = transactions?.filter(txn => {
    const matchesFilter = filter === 'all' || txn.status === filter;
    const matchesSearch = !searchTerm ||
      txn.order?.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.phone_number?.includes(searchTerm) ||
      txn.mpesa_receipt_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  }) || [];

  // Calculate statistics
  const stats = {
    total: transactions?.length || 0,
    completed: transactions?.filter(t => t.status === 'completed').length || 0,
    pending: transactions?.filter(t => t.status === 'pending').length || 0,
    failed: transactions?.filter(t => t.status === 'failed').length || 0,
    totalRevenue: transactions?.filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 0,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payment Tracking</h1>
              <p className="text-gray-600 mt-1">Monitor all M-Pesa transactions and order payments</p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-green-50 rounded-lg shadow-sm p-4">
              <p className="text-sm text-green-600 mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow-sm p-4">
              <p className="text-sm text-yellow-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
            </div>
            <div className="bg-red-50 rounded-lg shadow-sm p-4">
              <p className="text-sm text-red-600 mb-1">Failed</p>
              <p className="text-2xl font-bold text-red-700">{stats.failed}</p>
            </div>
            <div className="bg-blue-50 rounded-lg shadow-sm p-4">
              <p className="text-sm text-blue-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-blue-700">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Status</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === 'all'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('completed')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === 'completed'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === 'pending'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilter('failed')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === 'failed'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Failed
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Order #, Phone, Receipt, Email..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 mb-2">No transactions found</p>
              <p className="text-sm text-gray-400">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Transaction ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Order</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">M-Pesa Receipt</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((txn) => (
                    <tr key={txn.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <span className="font-mono text-xs text-gray-600">{txn.id.substring(0, 8)}...</span>
                      </td>
                      <td className="py-4 px-4">
                        {txn.order ? (
                          <Link
                            to={`/management/orders/${txn.order.id}`}
                            className="font-semibold text-blue-600 hover:underline"
                          >
                            {txn.order.order_number}
                          </Link>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{txn.user?.username || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{txn.user?.email || ''}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm text-gray-700">{txn.phone_number}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-bold text-lg text-gray-900">
                          {formatCurrency(txn.amount)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            txn.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : txn.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : txn.status === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {txn.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {txn.mpesa_receipt_number ? (
                          <span className="font-mono text-sm text-gray-700">{txn.mpesa_receipt_number}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-sm text-gray-700">
                            {new Date(txn.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(txn.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => {
                            alert(JSON.stringify({
                              id: txn.id,
                              status: txn.status,
                              amount: txn.amount,
                              phone: txn.phone_number,
                              receipt: txn.mpesa_receipt_number,
                              result: txn.result_desc,
                              raw_data: txn.raw_callback_data
                            }, null, 2));
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="mt-4 text-center text-sm text-gray-600">
          Showing {filteredTransactions.length} of {stats.total} transactions
        </div>
      </div>
    </div>
  );
}
