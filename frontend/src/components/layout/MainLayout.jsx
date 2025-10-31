import { useLocation } from 'react-router-dom';
import Navbar from "./Navbar";
import PromoBar from "./PromoBar";

export default function MainLayout({ children }) {
  const location = useLocation();

  // Don't show layout on management pages (they have their own layout)
  const isManagementPage = location.pathname.startsWith('/management') ||
                           location.pathname.startsWith('/admin-panel');

  // Check if we're on the home page
  const isHomePage = location.pathname === '/';

  if (isManagementPage) {
    return <>{children}</>;
  }

  return (
    <div className="bg-rose-50 min-h-screen flex flex-col">
      {/* PromoBar - Only on HomePage, above Navbar */}
      {isHomePage && <PromoBar />}

      {/* Navbar */}
      <Navbar />

      {/* Promo Banner Section - Only on HomePage, Mobile Responsive */}
      {isHomePage && (
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2">
          <div className="max-w-7xl mx-auto px-4 text-center text-xs sm:text-sm">
            🎯 <strong>HYBRID MARKETPLACE:</strong>
            <span className="hidden sm:inline"> Buy Instantly OR Bid to Save up to 70% |</span>
            <span className="sm:hidden"> Save up to 70% |</span>
            <a href="#browse" className="underline font-bold ml-1">EXPLORE NOW</a>
          </div>
        </div>
      )}

      {/* Page Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer - Mobile Responsive */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* About */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-orange-500">BidSoko</h3>
              <p className="text-gray-400 text-sm">
                Kenya's premier hybrid marketplace. Buy instantly or bid to save!
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="/" className="hover:text-orange-500 transition">Home</a></li>
                <li><a href="/browse" className="hover:text-orange-500 transition">Browse</a></li>
                <li><a href="/buy-now" className="hover:text-orange-500 transition">Buy Now</a></li>
                <li><a href="/cart" className="hover:text-orange-500 transition">Cart</a></li>
              </ul>
            </div>

            {/* Customer Service */}
            <div>
              <h3 className="text-lg font-bold mb-4">Customer Service</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>📞 0711 011 011</li>
                <li>📧 support@bidsoko.com</li>
                <li>🕐 Mon-Fri: 8AM-6PM</li>
              </ul>
            </div>

            {/* Follow Us */}
            <div>
              <h3 className="text-lg font-bold mb-4">Follow Us</h3>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-orange-500 transition">Facebook</a>
                <a href="#" className="text-gray-400 hover:text-orange-500 transition">Twitter</a>
                <a href="#" className="text-gray-400 hover:text-orange-500 transition">Instagram</a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2025 BidSoko. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
