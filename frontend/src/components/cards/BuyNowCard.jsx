import { Link } from "react-router-dom";

export default function BuyNowCard({ product }) {
  return (
    <div className="bg-white border border-gray-200 rounded-md overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <Link to={`/product/${product.id}`} className="block">
        <div className="w-full h-40 sm:h-48 md:h-52 bg-gray-100 flex items-center justify-center">
          {product.main_image ? (
            <img
              src={product.main_image}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
          ) : (
            <div className="text-gray-400 text-3xl sm:text-4xl">🛒</div>
          )}
        </div>

        <div className="p-2 sm:p-3">
          <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 mb-1">
            {product.title}
          </h3>
          <div className="text-orange-600 font-semibold text-sm sm:text-base">
            KSh {product.buy_now_price?.toLocaleString()}
          </div>
          {product.old_price && (
            <div className="text-xs text-gray-400 line-through">
              KSh {product.old_price.toLocaleString()}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
