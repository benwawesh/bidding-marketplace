import { Link } from 'react-router-dom';
import { isAuctionActive } from '../../utils/helpers';

export default function AuctionCard({ product }) {
  const isActive = isAuctionActive(product.start_time, product.end_time, product.status, product.product_type);

  return (
    <Link
      to={`/auction/${product.id}`}
      className="group bg-white rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col border border-gray-200 hover:border-red-300 relative"
    >
      {/* LIVE Badge */}
      {isActive && (
        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded z-10 flex items-center gap-1">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          LIVE
        </div>
      )}

      {/* Ended Badge */}
      {!isActive && product.status === 'closed' && (
        <div className="absolute top-2 left-2 bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded z-10">
          Ended
        </div>
      )}

      {/* Image - Consistent 200px height with object-contain */}
      <div className="w-full bg-white flex items-center justify-center overflow-hidden" style={{ height: '200px' }}>
        {product.main_image ? (
          <img
            src={product.main_image.startsWith('http') ? product.main_image : `${product.main_image}`}
            alt={product.title}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="text-gray-300 text-6xl">🎯</div>
        )}
      </div>

      {/* Product Info - Clean Jumia Style */}
      <div className="p-3 flex flex-col flex-grow">
        {/* Product Title - 2 lines max */}
        <h3 className="text-sm text-gray-800 line-clamp-2 mb-2 min-h-[2.5rem] group-hover:text-red-600 transition-colors">
          {product.title}
        </h3>

        {/* Category */}
        {product.category_name && (
          <div className="text-xs text-gray-500 mb-2">
            {product.category_name}
          </div>
        )}

        {/* Price Section */}
        <div className="mt-auto space-y-2">
          {/* Starting Bid */}
          <div>
            <div className="text-xs text-gray-500 mb-1">Starting Bid</div>
            <div className="text-lg font-bold text-gray-900">
              KSh {product.base_price?.toLocaleString()}
            </div>
          </div>

          {/* Current Highest Bid */}
          {product.highest_bid && (
            <div className="border-t pt-2">
              <div className="text-xs text-gray-500 mb-1">Current Bid</div>
              <div className="text-base font-bold text-red-600">
                KSh {product.highest_bid?.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
