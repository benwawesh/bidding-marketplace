import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { cartAPI } from '../../api/endpoints';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
            <span className="text-xl sm:text-2xl font-bold text-orange-600">BidSoko</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
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

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600">
                  Hi, <span className="font-semibold text-gray-900">{user?.first_name || user?.username}</span>
                </span>
                <Link
                  to={user?.is_superuser || user?.is_staff ? "/management" : "/dashboard"}
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
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-orange-600 font-medium transition">
                  Login
                </Link>
                <Link to="/signup" className="bg-orange-600 text-white px-4 py-2 rounded font-semibold hover:bg-orange-700 transition">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile: Cart and Menu Button */}
          <div className="flex md:hidden items-center gap-3">
            <Link to="/cart" className="relative">
              <span className="text-2xl">🛒</span>
              {isAuthenticated && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-orange-600 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              <Link to="/" className="text-gray-700 hover:text-orange-600 font-medium" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              <Link to="/browse" className="text-gray-700 hover:text-orange-600 font-medium" onClick={() => setMobileMenuOpen(false)}>
                Browse
              </Link>
              <Link to="/cart" className="text-gray-700 hover:text-orange-600 font-medium" onClick={() => setMobileMenuOpen(false)}>
                Cart {cartCount > 0 && `(${cartCount})`}
              </Link>

              {isAuthenticated ? (
                <>
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Hi, <span className="font-semibold">{user?.first_name || user?.username}</span>
                    </p>
                    <Link
                      to={user?.is_superuser || user?.is_staff ? "/management" : "/dashboard"}
                      className="block text-gray-700 hover:text-orange-600 font-medium mb-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      📊 Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left text-gray-700 hover:text-orange-600 font-medium"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <Link to="/login" className="block text-gray-700 hover:text-orange-600 font-medium" onClick={() => setMobileMenuOpen(false)}>
                    Login
                  </Link>
                  <Link to="/signup" className="block bg-orange-600 text-white px-4 py-2 rounded font-semibold hover:bg-orange-700 transition text-center" onClick={() => setMobileMenuOpen(false)}>
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
