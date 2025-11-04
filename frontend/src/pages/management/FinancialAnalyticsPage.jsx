import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ManagementLayout from '../../components/layout/ManagementLayout';
import api from '../../api/axios';
import { formatCurrency } from '../../utils/helpers';

export default function FinancialAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [transactionFilters, setTransactionFilters] = useState({
    status: '',
    payment_type: '',
    payment_method: '',
    search: ''
  });

  // Fetch financial analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['financial-analytics', days],
    queryFn: () => api.get(`/auctions/analytics/financial/?days=${days}`).then(res => res.data),
  });

  // Fetch transaction list
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', transactionFilters],
    queryFn: () => {
      const params = new URLSearchParams(transactionFilters).toString();
      return api.get(`/auctions/analytics/transactions/?${params}`).then(res => res.data);
    },
  });

  const handleExport = () => {
    window.location.href = '/api/auctions/analytics/transactions/export/';
  };

  if (analyticsLoading) {
    return (
      <ManagementLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading financial data...</p>
        </div>
      </ManagementLayout>
    );
  }

  return (
    <ManagementLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent mb-2">
              Financial Analytics
            </h1>
            <p className="text-gray-600">Comprehensive revenue and transaction analysis</p>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Time Range:</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
              <option value={365}>Last Year</option>
            </select>
          </div>
        </div>

        {/* Revenue Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">💰</div>
              <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">
                {days} Days
              </div>
            </div>
            <p className="text-sm opacity-90 mb-1">Total Revenue</p>
            <p className="text-3xl font-extrabold">{formatCurrency(analytics?.overview?.total_revenue || 0)}</p>
          </div>

          {/* Total Transactions */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">📊</div>
              <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                Transactions
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
            <p className="text-3xl font-extrabold text-gray-900">{analytics?.overview?.total_transactions || 0}</p>
          </div>

          {/* Average Transaction */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">📈</div>
              <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                Average
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Avg Transaction</p>
            <p className="text-3xl font-extrabold text-gray-900">{formatCurrency(analytics?.overview?.average_transaction || 0)}</p>
          </div>

          {/* Pending Amount */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">⏳</div>
              <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">
                {analytics?.overview?.pending_count || 0} Pending
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Pending Payments</p>
            <p className="text-3xl font-extrabold text-gray-900">{formatCurrency(analytics?.overview?.pending_amount || 0)}</p>
          </div>
        </div>

        {/* Revenue Streams - Two Main Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AUCTION REVENUE STREAM */}
          <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl shadow-lg border-2 border-rose-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-rose-500 to-orange-500 text-white rounded-full p-3 text-2xl">
                🎯
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Auction Revenue</h2>
                <p className="text-sm text-gray-600">Bidding & Auction Fees</p>
              </div>
            </div>

            {/* Total Auction Revenue */}
            <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Total Auction Revenue</p>
              <p className="text-3xl font-extrabold bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent">
                {formatCurrency(
                  (analytics?.revenue_breakdown?.participation_fees?.total || 0) +
                  (analytics?.revenue_breakdown?.final_pledges?.total || 0)
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {(analytics?.revenue_breakdown?.participation_fees?.count || 0) +
                 (analytics?.revenue_breakdown?.final_pledges?.count || 0)} total transactions
              </p>
            </div>

            {/* Breakdown */}
            <div className="space-y-3">
              {/* Participation Fees */}
              <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-rose-500">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">Participation Fees</p>
                  <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-xs font-bold">
                    {analytics?.revenue_breakdown?.participation_fees?.count || 0} txns
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics?.revenue_breakdown?.participation_fees?.total || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Registration fees to join auctions</p>
              </div>

              {/* Final Pledges */}
              <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-orange-500">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">Final Pledges</p>
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">
                    {analytics?.revenue_breakdown?.final_pledges?.count || 0} txns
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics?.revenue_breakdown?.final_pledges?.total || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Winning bid payments</p>
              </div>
            </div>
          </div>

          {/* BUY NOW REVENUE STREAM */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border-2 border-blue-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-full p-3 text-2xl">
                🛒
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Buy Now Revenue</h2>
                <p className="text-sm text-gray-600">Direct Sales & Orders</p>
              </div>
            </div>

            {/* Total Buy Now Revenue */}
            <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Total Buy Now Revenue</p>
              <p className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {formatCurrency(analytics?.revenue_breakdown?.buy_now_orders?.total || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {analytics?.revenue_breakdown?.buy_now_orders?.count || 0} total orders
              </p>
            </div>

            {/* Buy Now Details */}
            <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">Direct Sales</p>
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                  {analytics?.revenue_breakdown?.buy_now_orders?.count || 0} orders
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(analytics?.revenue_breakdown?.buy_now_orders?.total || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Instant purchase transactions</p>

              {/* Average Order Value */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-600 mb-1">Average Order Value</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(
                    analytics?.revenue_breakdown?.buy_now_orders?.count > 0
                      ? (analytics?.revenue_breakdown?.buy_now_orders?.total || 0) / analytics?.revenue_breakdown?.buy_now_orders?.count
                      : 0
                  )}
                </p>
              </div>
            </div>

            {/* Empty state encouragement */}
            {(!analytics?.revenue_breakdown?.buy_now_orders?.total || analytics?.revenue_breakdown?.buy_now_orders?.total === 0) && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-700">No buy now sales yet. Promote your products!</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Performing Auctions */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span>🏆</span>
            <span>Top Performing Auctions</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Auction</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Participants</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {analytics?.top_auctions?.map((auction, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm text-gray-900">{auction.auction__title}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">{auction.participants}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-rose-600">{formatCurrency(auction.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transaction List */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>📋</span>
              <span>Recent Transactions</span>
            </h2>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-lg font-semibold hover:from-rose-600 hover:to-orange-600 transition shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export CSV</span>
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <input
              type="text"
              placeholder="Search transaction..."
              value={transactionFilters.search}
              onChange={(e) => setTransactionFilters({ ...transactionFilters, search: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />

            <select
              value={transactionFilters.status}
              onChange={(e) => setTransactionFilters({ ...transactionFilters, status: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            <select
              value={transactionFilters.payment_type}
              onChange={(e) => setTransactionFilters({ ...transactionFilters, payment_type: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">All Types</option>
              <option value="participation">Participation Fee</option>
              <option value="final_pledge">Final Pledge</option>
              <option value="order">Buy Now Order</option>
            </select>

            <select
              value={transactionFilters.payment_method}
              onChange={(e) => setTransactionFilters({ ...transactionFilters, payment_method: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">All Methods</option>
              <option value="mpesa">M-Pesa</option>
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>

          {/* Transaction Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Transaction ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Auction</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactionsLoading ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : transactions?.results?.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions?.results?.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{transaction.transaction_id?.substring(0, 12)}...</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{transaction.user?.username}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{transaction.auction?.title || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          transaction.payment_type === 'participation'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {transaction.payment_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{formatCurrency(transaction.amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          transaction.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {transactions && transactions.total_pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <p>
                Showing {transactions.results?.length} of {transactions.count} transactions
              </p>
              <div className="flex gap-2">
                <span className="text-gray-500">Page {transactions.page} of {transactions.total_pages}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </ManagementLayout>
  );
}
