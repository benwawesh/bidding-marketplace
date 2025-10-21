import { useQuery } from '@tanstack/react-query';
import { auctionsAPI, categoriesAPI } from '../../api/endpoints';
import ManagementLayout from '../../components/layout/ManagementLayout';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/helpers';

export default function ManagementDashboard() {
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => auctionsAPI.getAll().then(res => res.data),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll().then(res => res.data),
  });

  // Calculate stats
  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    draft: products.filter(p => p.status === 'draft').length,
    closed: products.filter(p => p.status === 'closed').length,
    buyNow: products.filter(p => p.product_type === 'buy_now').length,
    auction: products.filter(p => p.product_type === 'auction').length,
    both: products.filter(p => p.product_type === 'both').length,
    categories: categories.length,
  };

  // Recent products
  const recentProducts = products.slice(0, 5);

  if (productsLoading) {
    return (
      <ManagementLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </ManagementLayout>
    );
  }

  return (
    <ManagementLayout>
      <div>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Management Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your platform.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Products */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 uppercase font-semibold">Total Products</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="text-4xl">📦</div>
            </div>
          </div>

          {/* Active */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 uppercase font-semibold">Active</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          {/* Draft */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 uppercase font-semibold">Draft</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.draft}</p>
              </div>
              <div className="text-4xl">📝</div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 uppercase font-semibold">Categories</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.categories}</p>
              </div>
              <div className="text-4xl">🏷️</div>
            </div>
          </div>
        </div>

        {/* Product Type Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Buy Now</h3>
              <span className="text-2xl">🛒</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.buyNow}</p>
            <p className="text-sm text-gray-600 mt-1">Fixed price products</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Auction Only</h3>
              <span className="text-2xl">🎯</span>
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.auction}</p>
            <p className="text-sm text-gray-600 mt-1">Bidding products</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Both Options</h3>
              <span className="text-2xl">⚡</span>
            </div>
            <p className="text-3xl font-bold text-purple-600">{stats.both}</p>
            <p className="text-sm text-gray-600 mt-1">Hybrid products</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/management/products/new"
              className="flex items-center gap-3 p-4 bg-red-50 hover:bg-red-100 rounded-lg transition border border-red-200"
            >
              <span className="text-3xl">➕</span>
              <div>
                <p className="font-semibold text-gray-900">Create Product</p>
                <p className="text-sm text-gray-600">Add new auction or buy now item</p>
              </div>
            </Link>

            <Link
              to="/management/products"
              className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition border border-blue-200"
            >
              <span className="text-3xl">📦</span>
              <div>
                <p className="font-semibold text-gray-900">Manage Products</p>
                <p className="text-sm text-gray-600">View and edit all products</p>
              </div>
            </Link>

            <Link
              to="/management/categories"
              className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition border border-purple-200"
            >
              <span className="text-3xl">🏷️</span>
              <div>
                <p className="font-semibold text-gray-900">Manage Categories</p>
                <p className="text-sm text-gray-600">Organize product categories</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Products */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Products</h2>
            <Link to="/management/products" className="text-red-600 hover:text-red-700 font-semibold text-sm">
              View All →
            </Link>
          </div>

          {recentProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No products yet</p>
              <Link
                to="/management/products/new"
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 inline-block"
              >
                Create First Product
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Product</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Price</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProducts.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                            {product.main_image && (
                              <img src={product.main_image} alt={product.title} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{product.title}</p>
                            <p className="text-sm text-gray-500">{product.category_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          product.product_type === 'auction' ? 'bg-red-100 text-red-700' :
                          product.product_type === 'buy_now' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {product.product_type === 'buy_now' ? 'Buy Now' : 
                           product.product_type === 'auction' ? 'Auction' : 'Both'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        {formatCurrency(product.base_price)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          product.status === 'active' ? 'bg-green-100 text-green-700' :
                          product.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          to={`/management/products/${product.id}/edit`}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          Edit
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
