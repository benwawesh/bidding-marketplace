import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/helpers';

export default function BuyNowCard({ product, onAddToCart, isAddingToCart }) {
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity < 5;
  const isOutOfStock = product.stock_quantity === 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(product.id, 1); // Add 1 item by default
  };

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
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <span className="text-blue-300 text-4xl">🛒</span>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isLowStock && (
            <span className="badge bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold low-stock-pulse">
              🔥 Only {product.stock_quantity} Left
            </span>
          )}
          {isOutOfStock && (
            <span className="badge bg-gray-500 text-white text-xs px-2 py-1 rounded-full font-bold">
              Out of Stock
            </span>
          )}
        </div>

        {/* Type Badge */}
        <div className="absolute top-2 right-2">
          <span className="badge bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-bold">
            Buy Now
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Title */}
        <Link to={`/product/${product.id}`}>
          <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition">
            {product.title}
          </h3>
        </Link>

        {/* Category */}
        {product.category_name && (
          <Link
            to={`/category/${product.category_name.toLowerCase()}`}
            className="text-xs text-gray-500 hover:text-blue-600 mb-2"
          >
            {product.category_name}
          </Link>
        )}

        {/* Price */}
        <div className="mb-3">
          <div className="text-2xl font-bold text-blue-600 price-pulse">
            {formatCurrency(product.buy_now_price)}
          </div>
          {product.units_sold > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              {product.units_sold} sold
            </div>
          )}
        </div>

        {/* Spacer to push button to bottom */}
        <div className="flex-grow"></div>

        {/* Add to Cart Button */}
        {!isOutOfStock && (
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className="quick-add-btn w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAddingToCart ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Adding...</span>
              </>
            ) : (
              <>
                <span>🛒</span>
                <span>Add to Cart</span>
              </>
            )}
          </button>
        )}

        {isOutOfStock && (
          <button
            disabled
            className="w-full bg-gray-300 text-gray-600 py-2 px-4 rounded-lg font-semibold cursor-not-allowed"
          >
            Out of Stock
          </button>
        )}
      </div>
    </div>
  );
}
