import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ManagementLayout from '../../components/layout/ManagementLayout';
import { auctionsAPI } from '../../api/endpoints';
import { formatCurrency } from '../../utils/helpers';

export default function ProductBuyersPage() {
  const { id } = useParams();

  // Fetch product details
  const { data: product } = useQuery({
    queryKey: ['product', id],
    queryFn: () => auctionsAPI.getById(id).then(res => res.data),
  });

  // Fetch buyers
  const { data: buyersData, isLoading } = useQuery({
    queryKey: ['product-buyers', id],
    queryFn: () => auctionsAPI.getBuyers(id).then(res => res.data),
  });

  if (isLoading) {
    return (
      <ManagementLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading buyers...</p>
        </div>
      </ManagementLayout>
    );
  }

  const buyers = buyersData?.buyers || [];
  const totalOrders = buyersData?.total_orders || 0;
  const totalUnits = buyersData?.total_units_sold || 0;
  const totalRevenue = buyersData?.total_revenue || 0;

  return (
    <ManagementLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link 
            to={`/management/products/${id}`} 
            className="text-red-600 hover:underline mb-2 inline-block"
          >
            ← Back to Product
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Buyers: {product?.title}
          </h1>
          <p className="text-gray-600">All customers who purchased this product</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600">
            <p className="text-sm text-gray-600 uppercase font-semibold">Total Orders</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{totalOrders}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-600">
            <p className="text-sm text-gray-600 uppercase font-semibold">Units Sold</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{totalUnits}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-600">
            <p className="text-sm text-gray-600 uppercase font-semibold">Total Revenue</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-600">
            <p className="text-sm text-gray-600 uppercase font-semibold">Price Per Unit</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {formatCurrency(product?.buy_now_price || 0)}
            </p>
          </div>
        </div>

        {/* Buyers Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">All Buyers & Orders</h2>
          </div>

          {buyers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Purchases Yet</h3>
              <p className="text-gray-600">No one has purchased this product</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Order #</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Shipping Address</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Qty</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Total</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {buyers.map((buyer) => (
                    <tr key={buyer.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <Link 
                          to={`/management/orders/${buyer.id}`}
                          className="font-mono font-semibold text-blue-600 hover:text-blue-700"
                        >
                          {buyer.order_number}
                        </Link>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-gray-900">{buyer.shipping_name}</p>
                          <p className="text-sm text-gray-500">{buyer.customer.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-900">{buyer.shipping_phone}</td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          <p className="text-gray-900">{buyer.shipping_address}</p>
                          <p className="text-gray-500">{buyer.shipping_city}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-gray-900">{buyer.quantity}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-green-600">
                          {formatCurrency(buyer.total_price)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          buyer.order_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          buyer.order_status === 'paid' ? 'bg-green-100 text-green-700' :
                          buyer.order_status === 'processing' ? 'bg-blue-100 text-blue-700' :
                          buyer.order_status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                          buyer.order_status === 'delivered' ? 'bg-teal-100 text-teal-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {buyer.order_status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {new Date(buyer.created_at).toLocaleDateString()}
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
