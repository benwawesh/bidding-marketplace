import { Link } from "react-router-dom";

export default function BuyNowCard({ product }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
      <Link to={`/product/${product.id}`} className="block">
        {/* Image - Industry standard aspect ratio 4:3 */}
        <div className="w-full aspect-[4/3] bg-gray-100 flex items-center justify-center overflow-hidden">
          {product.main_image ? (
            <img
              src={product.main_image}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-400 text-4xl">🛒</div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-3">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem]">
            {product.title}
          </h3>
          <div className="text-orange-600 font-bold text-base mb-1">
            KSh {product.buy_now_price?.toLocaleString()}
          </div>
          {product.old_price && (
            <div className="text-xs text-gray-400 line-through">
              KSh {product.old_price.toLocaleString()}
            </div>
          )}
        </div>
      </Link>

      {/* Always Visible Buy Now Button */}
      <div className="px-3 pb-3 mt-auto">
        <Link
          to={`/product/${product.id}`}
          className="block w-full bg-orange-600 text-white text-center py-2 rounded-md font-semibold text-sm hover:bg-orange-700 transition"
        >
          Buy Now
        </Link>
      </div>
    </div>
  );
}
