import { useRef } from "react";
import BuyNowCard from "./BuyNowCard"; // make sure path is correct
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProductRow({ title, products }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    const { current } = scrollRef;
    if (current) {
      const scrollAmount = current.offsetWidth * 0.8; // scroll by 80% of container width
      current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative mb-6">
      {/* Section Header */}
      <div className="flex justify-between items-center mb-2 px-2">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <a
        href="/buy-now"
        className="text-sm text-orange-500 font-semibold hover:underline"
        >
        View All
        </a>

      </div>

      {/* Slider Area */}
      <div className="relative">
        {/* Left Arrow */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 z-10 bg-white shadow-md rounded-full p-2 top-1/2 -translate-y-1/2 hover:bg-gray-100 hidden md:block"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Scrollable product container */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-scroll scrollbar-hide scroll-smooth px-1"
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="min-w-[180px] sm:min-w-[200px] md:min-w-[220px] lg:min-w-[240px] flex-shrink-0"
            >
              <BuyNowCard product={product} />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 z-10 bg-white shadow-md rounded-full p-2 top-1/2 -translate-y-1/2 hover:bg-gray-100 hidden md:block"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
