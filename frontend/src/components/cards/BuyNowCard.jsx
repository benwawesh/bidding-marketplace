import { Link } from "react-router-dom";

export default function BuyNowCard({ product }) {
  // Calculate discount percentage if old price exists
  const discountPercent = product.old_price
    ? Math.round(((product.old_price - product.buy_now_price) / product.old_price) * 100)
    : null;

  return (
    <Link
      to={`/product/${product.id}`}
      className="group bg-white rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col border border-gray-200 hover:border-orange-300 relative"
    >
      {/* Discount Badge - Jumia Style */}
      {discountPercent && discountPercent > 0 && (
        <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded z-10">
          -{discountPercent}%
        </div>
      )}

      {/* Image - Better aspect ratio with object-contain to avoid cropping */}
      <div className="w-full bg-white flex items-center justify-center overflow-hidden" style={{ height: '200px' }}>
        {product.main_image ? (
          <img
            src={product.main_image}
            alt={product.title}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="text-gray-300 text-6xl">🛒</div>
        )}
      </div>

      {/* Product Info - Compact Jumia Style */}
      <div className="p-3 flex flex-col flex-grow">
        {/* Product Title - 2 lines max */}
        <h3 className="text-sm text-gray-800 line-clamp-2 mb-2 min-h-[2.5rem] group-hover:text-orange-600 transition-colors">
          {product.title}
        </h3>

        {/* Price Section */}
        <div className="mt-auto">
          <div className="text-lg font-bold text-gray-900 mb-1">
            KSh {product.buy_now_price?.toLocaleString()}
          </div>

          {/* Old Price with strikethrough */}
          {product.old_price && (
            <div className="text-xs text-gray-400 line-through">
              KSh {product.old_price.toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
