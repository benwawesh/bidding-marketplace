import { Link } from 'react-router-dom';
import { formatCurrency, getTimeRemaining, isAuctionActive } from '../../utils/helpers';

export default function BothCard({ product }) {
  const timeLeft = getTimeRemaining(product.end_time);
  const isActive = isAuctionActive(product.start_time, product.end_time);
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity < 5;

  return (
    <div className="product-card bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      {/* Image Container */}
      <Link to={`/product/${product.id}`} className="block relative overflow-hidden">
        <div className="product-image aspect-square w-full">
          {product.main_image ? (
            <img 
              src={product.main_image} 
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
              <span className="text-purple-300 text-4xl">⚡</span>
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
          {isLowStock && (
            <span className="badge bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold low-stock-pulse">
              🔥 Only {product.stock_quantity} Left
            </span>
          )}
        </div>

        {/* Type Badge */}
        <div className="absolute top-2 right-2">
          <span className="badge bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-bold">
            Both Options
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Title */}
        <Link to={`/product/${product.id}`}>
          <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-purple-600 transition">
            {product.title}
          </h3>
        </Link>

        {/* Category */}
        {product.category_name && (
          <Link 
            to={`/category/${product.category_name.toLowerCase()}`}
            className="text-xs text-gray-500 hover:text-purple-600 mb-2"
          >
            {product.category_name}
          </Link>
        )}

        {/* Dual Pricing */}
        <div className="mb-3">
          {/* Buy Now Option */}
          <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
            <div className="text-xs text-gray-600 mb-1">Buy Now</div>
            <div className="text-lg font-bold text-blue-600">
              {formatCurrency(product.buy_now_price)}
            </div>
            {product.stock_quantity > 0 && (
              <div className="text-xs text-green-600 mt-1">
                ✓ In Stock ({product.stock_quantity})
              </div>
            )}
          </div>

          {/* Auction Option */}
          <div className="bg-red-50 border border-red-200 rounded p-2">
            <div className="text-xs text-gray-600 mb-1">Or Bid Starting At</div>
            <div className="text-lg font-bold text-red-600">
              {formatCurrency(product.base_price)}
            </div>
            {product.highest_bid && (
              <div className="text-xs text-gray-600 mt-1">
                Current: {formatCurrency(product.highest_bid)}
              </div>
            )}
            {isActive && timeLeft && (
              <div className="text-xs font-semibold text-red-600 mt-1">
                {timeLeft} left
              </div>
            )}
          </div>
        </div>

        {/* Spacer to push buttons to bottom */}
        <div className="flex-grow"></div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Link
            to={`/product/${product.id}`}
            className="quick-add-btn bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all duration-300 text-center"
          >
            🛒 Buy
          </Link>
          {isActive ? (
            <Link
              to={`/product/${product.id}`}
              className="quick-add-btn bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-red-700 transition-all duration-300 text-center"
            >
              🎯 Bid
            </Link>
          ) : (
            <button
              disabled
              className="bg-gray-300 text-gray-600 py-2 px-3 rounded-lg text-sm font-semibold cursor-not-allowed"
            >
              Ended
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
