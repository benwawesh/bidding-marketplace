import { Link } from 'react-router-dom';

export default function LeftSidebar({ categories = [] }) {
  return (
    <aside className="hidden lg:block w-64 flex-shrink-0">
      <div className="sticky top-4">
        
        {/* Categories Section */}
        <div className="bg-white rounded shadow-sm p-4 mb-4">
          <h3 className="font-bold text-lg mb-3 text-gray-900 uppercase tracking-wide">
            Categories
          </h3>
          <nav className="space-y-1">
            <Link
              to="/browse"
              className="block px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded transition"
            >
              All Products
            </Link>
            {categories.length > 0 ? (
              categories.map(category => (
                <Link
                  key={category.id}
                  to={`/category/${category.slug || category.name.toLowerCase()}`}
                  className="block px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded transition"
                >
                  {category.name}
                  {category.auction_count > 0 && (
                    <span className="float-right text-xs text-gray-500">({category.auction_count})</span>
                  )}
                </Link>
              ))
            ) : (
              <div className="text-sm text-gray-500 px-3 py-2">No categories available</div>
            )}
          </nav>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded shadow-sm p-4 mb-4">
          <h3 className="font-bold text-lg mb-3 text-gray-900 uppercase tracking-wide">
            Quick Filters
          </h3>
          <div className="space-y-3">
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm text-gray-700">Free Shipping</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm text-gray-700">On Sale</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm text-gray-700">Low Stock</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm text-gray-700">New Arrivals</span>
            </label>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded shadow-sm p-4">
          <h3 className="font-bold text-lg mb-3 uppercase tracking-wide">
            How It Works
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-white text-orange-600 rounded-full flex items-center justify-center font-bold text-xs">1</span>
              <div>
                <div className="font-semibold">Browse</div>
                <div className="text-xs opacity-90">Find products you love</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-white text-orange-600 rounded-full flex items-center justify-center font-bold text-xs">2</span>
              <div>
                <div className="font-semibold">Choose</div>
                <div className="text-xs opacity-90">Buy now or bid to save</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-white text-orange-600 rounded-full flex items-center justify-center font-bold text-xs">3</span>
              <div>
                <div className="font-semibold">Win!</div>
                <div className="text-xs opacity-90">Get amazing deals</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
}
