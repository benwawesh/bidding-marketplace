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

          {/* Stock and Sales Info */}
          <div className="mt-2 flex items-center justify-between text-xs">
            {/* Stock Remaining */}
            {product.stock_quantity !== undefined && (
              <div className={`font-medium ${product.stock_quantity < 10 ? 'text-red-600' : 'text-green-600'}`}>
                {product.stock_quantity > 0 ? (
                  <span>{product.stock_quantity} left</span>
                ) : (
                  <span className="text-red-600">Out of stock</span>
                )}
              </div>
            )}

            {/* Units Sold */}
            {product.units_sold > 0 && (
              <div className="text-gray-500">
                {product.units_sold} sold
              </div>
            )}
          </div>

          {/* Fast Moving Indicator */}
          {product.units_sold >= 10 && (
            <div className="mt-1 flex items-center gap-1 text-xs text-orange-600 font-medium">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              <span>Fast moving</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
