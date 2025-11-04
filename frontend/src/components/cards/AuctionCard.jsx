import { Link } from 'react-router-dom';
import { formatCurrency, isAuctionActive } from '../../utils/helpers';

export default function AuctionCard({ product }) {
  const isActive = isAuctionActive(product.start_time, product.end_time, product.status, product.product_type);

  return (
    <div className="product-card bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-2xl hover:border-orange-200 transition-all duration-500 flex flex-col h-full group">
      {/* Image Container - Fixed height with object-contain */}
      <Link to={`/auction/${product.id}`} className="block relative overflow-hidden">
        <div className="product-image w-full bg-white flex items-center justify-center relative" style={{ height: '200px' }}>
          {product.main_image ? (
            <img
              src={product.main_image.startsWith('http')
                ? product.main_image
                : `${product.main_image}`
              }
              alt={product.title}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-rose-100 via-orange-100 to-red-200 flex items-center justify-center">
              <span className="text-rose-300 text-6xl">🎯</span>
            </div>
          )}
          {/* Overlay gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isActive && (
            <span className="badge bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              LIVE
            </span>
          )}
          {!isActive && product.status === 'closed' && (
            <span className="badge bg-gray-600 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg backdrop-blur-sm">
              Ended
            </span>
          )}
          {!isActive && product.status === 'draft' && (
            <span className="badge bg-amber-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg backdrop-blur-sm">
              Draft
            </span>
          )}
        </div>

        {/* Type Badge */}
        <div className="absolute top-3 right-3">
          <span className="badge bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg backdrop-blur-sm">
            🎯 Auction
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Title */}
        <Link to={`/auction/${product.id}`}>
          <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-red-600 transition">
            {product.title}
          </h3>
        </Link>

        {/* Category */}
        {product.category_name && (
          <Link 
            to={`/category/${product.category_name.toLowerCase()}`}
            className="text-xs text-gray-500 hover:text-red-600 mb-2"
          >
            {product.category_name}
          </Link>
        )}

        {/* Pricing Info */}
        <div className="mb-3 space-y-3">
          <div className="bg-gradient-to-r from-rose-50 to-orange-50 rounded-lg p-3 border border-rose-100">
            <div className="text-xs text-gray-600 mb-1 font-medium">Bidding Starts At</div>
            <div className="text-2xl font-extrabold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
              {formatCurrency(product.base_price)}
            </div>
          </div>

          {product.highest_bid && (
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="text-xs text-emerald-700 font-bold">Current Highest Bid</div>
              </div>
              <div className="text-xl font-extrabold text-emerald-700">
                {formatCurrency(product.highest_bid)}
              </div>
            </div>
          )}
        </div>

        {/* Enticing Message */}
        {isActive && (
          <div className="bg-gradient-to-r from-orange-100 to-rose-100 border-2 border-orange-300 rounded-xl p-3 mb-3 shadow-sm">
            <p className="text-xs text-orange-800 font-bold text-center flex items-center justify-center gap-2">
              <span className="text-base">🏆</span>
              <span>Compete to win at amazing prices!</span>
            </p>
          </div>
        )}

        {/* Spacer to push button to bottom */}
        <div className="flex-grow"></div>

        {/* Action Button */}
        {isActive ? (
          <Link
            to={`/auction/${product.id}`}
            className="quick-add-btn w-full bg-gradient-to-r from-red-600 to-rose-600 text-white py-3 px-4 rounded-xl font-bold hover:from-red-700 hover:to-rose-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
            </svg>
            <span>Join Auction</span>
          </Link>
        ) : product.status === 'draft' ? (
          <button
            disabled
            className="w-full bg-gray-200 text-gray-500 py-3 px-4 rounded-xl font-semibold cursor-not-allowed opacity-60"
          >
            Draft
          </button>
        ) : (
          <button
            disabled
            className="w-full bg-gray-200 text-gray-500 py-3 px-4 rounded-xl font-semibold cursor-not-allowed opacity-60"
          >
            Auction Ended
          </button>
        )}
      </div>
    </div>
  );
}
