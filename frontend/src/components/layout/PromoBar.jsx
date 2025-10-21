import { Link } from 'react-router-dom';

export default function PromoBar() {
  return (
    <div className="bg-[#f9e5c9] text-gray-800 border-b border-orange-200">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Side - Brand/Highlight */}
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold tracking-wide text-orange-600">
              🎯 BIDMARKET LUXE
            </span>
          </div>

          {/* Center - Announcement/Highlight */}
          <div className="flex-1 text-center">
            <p className="text-sm md:text-base font-semibold">
              📞 Call <span className="text-orange-600 font-bold">0711 011 011</span> to order | 
              <span className="ml-2">🚚 Free Delivery on Orders Over KES 5,000</span>
            </p>
          </div>

          {/* Right Side - CTA Button */}
          <Link
            to="/browse"
            className="bg-orange-600 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            SHOP NOW
          </Link>
        </div>
      </div>
    </div>
  );
}
