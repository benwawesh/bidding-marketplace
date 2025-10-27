import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import axios from "../api/axios";

export default function CategoryList() {
  const { data: categories = [], isLoading, isError } = useQuery({
    queryKey: ["categories"],
    queryFn: () => axios.get("/api/categories/").then(res => res.data),
  });

  if (isLoading) return <p className="text-center mt-10">Loading categories...</p>;
  if (isError) return <p className="text-center mt-10 text-red-500">Failed to load categories.</p>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Browse Categories</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categories.map(cat => (
          <Link
            key={cat.id}
            to={`/category/${cat.id}`}
            className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition bg-white"
          >
            <img
              src={cat.image ? `http://127.0.0.1:8000${cat.image}` : "/placeholder.jpg"}
              alt={cat.name}
              className="w-full h-40 object-cover"
            />
            <div className="p-3">
              <h2 className="text-lg font-semibold text-gray-800">{cat.name}</h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
