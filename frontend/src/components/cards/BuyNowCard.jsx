import { Link } from "react-router-dom";

export default function BuyNowCard({ product }) {
  // Calculate discount percentage if market price exists
  const discountPercent = product.market_price
    ? Math.round(((product.market_price - product.buy_now_price) / product.market_price) * 100)
    : null;

  return (
    <Link
      to={`/product/${product.id}`}
      className="group bg-white rounded-lg overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col border border-gray-200 hover:border-red-400 relative"
    >
      {/* Flash Sale Header - Jumia Style Red Background */}
      {discountPercent && discountPercent > 0 && (
        <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wide">Flash Sale</span>
          </div>
          <div className="bg-white text-red-600 text-xs font-black px-2 py-0.5 rounded">
            -{discountPercent}%
          </div>
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
        <h3 className="text-sm text-gray-800 line-clamp-2 mb-2 min-h-[2.5rem] group-hover:text-red-600 transition-colors">
          {product.title}
        </h3>

        {/* Price Section */}
        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-1">
            <div className="text-xl font-bold text-gray-900">
              KSh {product.buy_now_price?.toLocaleString()}
            </div>
            {/* Market Price with strikethrough */}
            {product.market_price && (
              <div className="text-xs text-gray-400 line-through">
                KSh {product.market_price.toLocaleString()}
              </div>
            )}
          </div>

          {/* Discount Savings */}
          {product.market_price && discountPercent > 0 && (
            <div className="text-xs text-green-600 font-medium mb-2">
              You save KSh {(product.market_price - product.buy_now_price).toLocaleString()}
            </div>
          )}

          {/* Stock Info Only */}
          {product.stock_quantity !== undefined && (
            <div className="mt-2">
              <div className={`text-xs font-medium ${product.stock_quantity < 10 ? 'text-red-600' : 'text-green-600'}`}>
                {product.stock_quantity > 0 ? (
                  <span>✓ {product.stock_quantity} units left</span>
                ) : (
                  <span className="text-red-600">✗ Out of stock</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
