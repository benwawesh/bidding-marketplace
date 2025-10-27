import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "../api/axios";
import { formatCurrency } from "../utils/helpers";

export default function CategoryDetail() {
  const { id } = useParams();

  const { data: category, isLoading, isError } = useQuery({
    queryKey: ["category", id],
    queryFn: () => axios.get(`/api/categories/${id}/`).then(res => res.data),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["category-products", id],
    queryFn: () => axios.get(`/api/categories/${id}/products/`).then(res => res.data),
  });

  if (isLoading) return <p className="text-center mt-10">Loading category...</p>;
  if (isError) return <p className="text-center mt-10 text-red-500">Failed to load category.</p>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
        <p className="text-gray-600">{category.description}</p>
      </div>

      {products.length === 0 ? (
        <p className="text-center text-gray-600">No products in this category yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(prod => (
            <Link
              key={prod.id}
              to={`/auction/${prod.id}`}
              className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition bg-white"
            >
              <img
                src={prod.main_image ? `http://127.0.0.1:8000${prod.main_image}` : "/placeholder.jpg"}
                alt={prod.title}
                className="w-full h-40 object-cover"
              />
              <div className="p-3">
                <h2 className="text-lg font-semibold text-gray-800 mb-1">{prod.title}</h2>
                <p className="text-sm text-gray-600 mb-1">{formatCurrency(prod.base_price)}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{prod.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
