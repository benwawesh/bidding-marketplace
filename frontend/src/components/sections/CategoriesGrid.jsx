import { Link } from 'react-router-dom';

export default function CategoriesGrid({ categories = [] }) {
  // Only show active categories
  const activeCategories = categories.filter(cat => cat.is_active);

  if (activeCategories.length === 0) {
    return null; // Don't show section if no categories
  }

  return (
    <section className="bg-white rounded shadow-sm p-6 mb-6">
      {/* Section Title */}
      <h2 className="text-xl font-bold text-gray-900 mb-6 uppercase tracking-wide">
        Shop by Category
      </h2>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {activeCategories.map((category) => (
          <Link
            key={category.id}
            to={`/category/${category.slug}`}
            className="flex flex-col items-center"
          >
            {/* Category Card */}
            <div className="bg-white border border-gray-200 rounded p-3 w-full transition-shadow">
              {/* Category Image */}
              <div className="aspect-square w-full mb-3 overflow-hidden rounded">
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  // Placeholder for missing images
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-4xl">📦</span>
                  </div>
                )}
              </div>

              {/* Category Name */}
              <h3 className="text-sm text-center text-gray-700 font-medium line-clamp-2">
                {category.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
