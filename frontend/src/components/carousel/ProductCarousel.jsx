import { useState, useRef } from 'react';

export default function ProductCarousel({ children, title, viewAllLink }) {
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.8; // Scroll 80% of visible width
    const newScrollLeft = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });

    // Update arrow visibility after scroll
    setTimeout(() => {
      updateArrowVisibility();
    }, 300);
  };

  const updateArrowVisibility = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setShowLeftArrow(container.scrollLeft > 10);
    setShowRightArrow(
      container.scrollLeft < (container.scrollWidth - container.clientWidth - 10)
    );
  };

  return (
    <div className="relative group">
      {/* Left Arrow */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100 hidden sm:block"
          aria-label="Scroll left"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Scrollable Container - Jumia Style */}
      <div
        ref={scrollContainerRef}
        onScroll={updateArrowVisibility}
        className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        style={{
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE/Edge
        }}
      >
        {children}
      </div>

      {/* Right Arrow */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100 hidden sm:block"
          aria-label="Scroll right"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Hide scrollbar CSS */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
