import { Link } from 'react-router-dom';

export default function PromoBar() {
  return (
    <div className="bg-[#f9e5c9] text-gray-800 border-b border-orange-200">
      <div className="max-w-7xl mx-auto px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left Side - Brand/Highlight - Mobile Responsive */}
          <div className="flex items-center">
            <span className="text-base sm:text-xl font-bold tracking-wide text-orange-600">
              🎯 <span className="hidden sm:inline">BIDMARKET LUXE</span>
              <span className="sm:hidden">BIDMARKET</span>
            </span>
          </div>

          {/* Center - Announcement/Highlight - Mobile Responsive */}
          <div className="flex-1 text-center hidden sm:block">
            <p className="text-xs md:text-sm font-semibold">
              📞 <span className="text-orange-600 font-bold">0711 011 011</span> |
              <span className="ml-2 hidden md:inline">🚚 Free Delivery on Orders Over KES 5,000</span>
            </p>
          </div>

          {/* Mobile: Show phone number only */}
          <div className="flex-1 text-center sm:hidden">
            <p className="text-xs font-semibold">
              📞 <span className="text-orange-600 font-bold">0711 011 011</span>
            </p>
          </div>

          {/* Right Side - CTA Button - Mobile Responsive */}
          <Link
            to="/browse"
            className="bg-orange-600 text-white px-3 py-1.5 sm:px-6 sm:py-2 rounded-full font-bold text-xs sm:text-sm hover:bg-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 whitespace-nowrap"
          >
            SHOP NOW
          </Link>
        </div>
      </div>
    </div>
  );
}
