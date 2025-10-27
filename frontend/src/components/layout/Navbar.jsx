import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { cartAPI } from '../../api/endpoints';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  // Fetch cart count - only if user is authenticated
  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: cartAPI.getCart,
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const cartCount = cart?.data?.total_items || 0;

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-orange-600">BidMarket</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link to="/" className="text-gray-700 hover:text-orange-600 font-medium transition">
              Home
            </Link>
            <Link to="/browse" className="text-gray-700 hover:text-orange-600 font-medium transition">
              Browse
            </Link>
            <Link to="/cart" className="text-gray-700 hover:text-orange-600 font-medium transition flex items-center gap-2 relative">
              <span className="text-xl">🛒</span>
              <span>Cart</span>
              {isAuthenticated && cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {/* Logged In */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    Hi, <span className="font-semibold text-gray-900">{user?.first_name || user?.username}</span>
                  </span>
                  <Link
                    to="/dashboard"
                    className="text-sm text-gray-700 hover:text-orange-600 font-medium"
                  >
                    📊 Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded font-medium transition"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Logged Out */}
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-orange-600 font-medium transition"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-orange-600 text-white px-4 py-2 rounded font-semibold hover:bg-orange-700 transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
