import { Link, useLocation } from 'react-router-dom';
import Navbar from './Navbar';

export default function ManagementLayout({ children }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-rose-100">
      {/* Use the same Navbar from HomePage */}
      <Navbar />

      {/* Management Banner */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-3">
        <div className="w-full px-6 text-center">
          <span className="text-lg font-semibold">👑 Management Portal</span>
          <span className="text-gray-400 ml-4">Admin Dashboard</span>
        </div>
      </div>

      <div className="w-full px-6 py-6">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-6">
              <nav className="space-y-2">
                <Link
                  to="/management"
                  className={`block px-4 py-3 rounded-lg transition ${
                    location.pathname === '/management'
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  📊 Dashboard
                </Link>

                <Link
                  to="/management/products/new"
                  className={`block px-4 py-3 rounded-lg transition ${
                    location.pathname === '/management/products/new'
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  ➕ Create Product
                </Link>

                <Link
                  to="/management/products"
                  className={`block px-4 py-3 rounded-lg transition ${
                    isActive('/management/products') && location.pathname !== '/management/products/new'
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  📦 All Products
                </Link>

                <Link
                  to="/management/categories"
                  className={`block px-4 py-3 rounded-lg transition ${
                    isActive('/management/categories')
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  🏷️ Categories
                </Link>

                <Link
                  to="/management/orders"
                  className={`block px-4 py-3 rounded-lg transition ${
                    isActive('/management/orders')
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  📋 Order Management
                </Link>

                <Link
                  to="/management/users"
                  className={`block px-4 py-3 rounded-lg transition ${
                    isActive('/management/users')
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  👥 Users
                </Link>

                <Link
                  to="/management/promobar"
                  className={`block px-4 py-3 rounded-lg transition ${
                    isActive('/management/promobar')
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  🎨 Promo Bar
                </Link>

                <Link
                  to="/management/hero-banners"
                  className={`block px-4 py-3 rounded-lg transition ${
                    isActive('/management/hero-banners')
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  🖼️ Hero Banners
                </Link>

                <Link
                  to="/management/special-offer-banners"
                  className={`block px-4 py-3 rounded-lg transition ${
                    isActive('/management/special-offer-banners')
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  🎉 Special Offers
                </Link>

                <Link
                  to="/management/analytics/financial"
                  className={`block px-4 py-3 rounded-lg transition ${
                    isActive('/management/analytics/financial')
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  💰 Financial Analytics
                </Link>
              </nav>

              {/* Quick Links */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <Link
                  to="/"
                  className="block px-4 py-2 text-sm text-gray-600 hover:text-red-600 transition"
                >
                  ← Back to Site
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
