import { Link } from "react-router-dom";

export default function CategoriesGrid({ categories }) {
  if (!Array.isArray(categories) || categories.length === 0) {
    return (
      <div className="flex justify-center items-center py-16">
        <p className="text-gray-400 text-lg animate-pulse">Loading categories...</p>
      </div>
    );
  }

  const activeCategories = categories.filter((cat) => cat?.is_active);

  if (activeCategories.length === 0) return null;

  return (
    <section className="bg-white rounded-lg sm:rounded-2xl shadow-sm p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 md:mb-10">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 md:mb-8 text-center uppercase tracking-wide">
        Shop by Category
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
        {activeCategories.map((category) => (
          <Link
            key={category?.id}
            to={`/category/${category?.slug || "#"}`}
            className="group flex flex-col items-center text-center transition-all duration-300 hover:scale-105"
          >
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full overflow-hidden shadow-sm border border-gray-200 bg-gray-50 flex items-center justify-center">
              {category?.image ? (
                <img
                  src={category.image}
                  alt={category.name || "Category"}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <span className="text-gray-400 text-2xl sm:text-3xl md:text-4xl">📦</span>
                </div>
              )}
            </div>

            <h3 className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600 font-normal line-clamp-2 group-hover:text-orange-600 transition-colors duration-300">
              {category?.name || ""}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
