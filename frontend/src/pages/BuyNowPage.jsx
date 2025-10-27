import { useQuery } from "@tanstack/react-query";
import { auctionsAPI } from "../api/endpoints";
import BuyNowCard from "../components/cards/BuyNowCard";
import MainLayout from "../components/layout/MainLayout";


export default function BuyNowPage() {
  const { data: auctions = [], isLoading } = useQuery({
    queryKey: ["buyNowAll"],
    queryFn: () => auctionsAPI.getAll().then((res) => res.data),
  });

  // Filter active Buy Now products
  const buyNowProducts = auctions.filter(
    (p) =>
      (p.product_type === "buy_now" || p.product_type === "both") &&
      p.status === "active"
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <p className="text-gray-600">Loading Buy Now products...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-6">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-orange-600 mb-6">
          Buy Now - Instant Purchase
        </h1>

        {buyNowProducts.length === 0 ? (
          <div className="text-center text-gray-500">
            No Buy Now products available at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {buyNowProducts.map((product) => (
              <BuyNowCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 