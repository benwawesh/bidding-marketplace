import { Link } from 'react-router-dom';
import { formatCurrency, isAuctionActive } from '../../utils/helpers';

export default function AuctionCard({ product }) {
  const isActive = isAuctionActive(product.start_time, product.end_time, product.status, product.product_type);

  return (
    <div className="product-card bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      {/* Image Container */}
      <Link to={`/auction/${product.id}`} className="block relative overflow-hidden">
        <div className="product-image aspect-square w-full">
          {product.main_image ? (
            <img 
              src={product.main_image.startsWith('http') 
                ? product.main_image 
                : `${product.main_image}`
              } 
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
              <span className="text-red-300 text-4xl">🎯</span>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isActive && (
            <span className="badge bg-red-600 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
              <span className="pulse-dot"></span>
              LIVE
            </span>
          )}
          {!isActive && product.status === 'closed' && (
            <span className="badge bg-gray-500 text-white text-xs px-2 py-1 rounded-full font-bold">
              Ended
            </span>
          )}
          {!isActive && product.status === 'draft' && (
            <span className="badge bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-bold">
              Draft
            </span>
          )}
        </div>

        {/* Type Badge */}
        <div className="absolute top-2 right-2">
          <span className="badge bg-red-600 text-white text-xs px-2 py-1 rounded-full font-bold">
            Auction
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
        <div className="mb-3">
          <div className="mb-2">
            <div className="text-xs text-gray-500 mb-1">Bidding Starts At</div>
            <div className="text-xl font-bold text-red-600">
              {formatCurrency(product.base_price)}
            </div>
          </div>

          {product.highest_bid && (
            <div className="bg-green-50 border border-green-200 rounded p-2">
              <div className="text-xs text-green-700 font-semibold mb-1">Current Highest Bid</div>
              <div className="text-lg font-bold text-green-700">
                {formatCurrency(product.highest_bid)}
              </div>
            </div>
          )}
        </div>

        {/* Enticing Message */}
        {isActive && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-2 mb-3">
            <p className="text-xs text-orange-700 font-semibold text-center">
              🏆 Compete to win at amazing prices!
            </p>
          </div>
        )}

        {/* Spacer to push button to bottom */}
        <div className="flex-grow"></div>

        {/* Action Button */}
        {isActive ? (
          <Link
            to={`/auction/${product.id}`}
            className="quick-add-btn w-full bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <span>🎯</span>
            <span>Join Auction</span>
          </Link>
        ) : product.status === 'draft' ? (
          <button
            disabled
            className="w-full bg-gray-300 text-gray-600 py-2 px-4 rounded-lg font-semibold cursor-not-allowed"
          >
            Draft
          </button>
        ) : (
          <button
            disabled
            className="w-full bg-gray-300 text-gray-600 py-2 px-4 rounded-lg font-semibold cursor-not-allowed"
          >
            Auction Ended
          </button>
        )}
      </div>
    </div>
  );
}
