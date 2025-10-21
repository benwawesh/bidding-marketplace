import { useState, useRef } from 'react';

export default function HorizontalCarousel({ 
  title, 
  titleColor = 'gray', 
  viewAllLink, 
  children 
}) {
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const colorClasses = {
    blue: 'text-blue-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    gray: 'text-gray-900',
  };

  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 300;
    const newScrollLeft = direction === 'left' 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });

    // Update arrow visibility after scroll
    setTimeout(() => {
      updateArrows();
    }, 300);
  };

  const updateArrows = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setShowLeftArrow(container.scrollLeft > 0);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-xl font-bold ${colorClasses[titleColor]}`}>
          {title}
        </h2>
        {viewAllLink && (
          <a 
            href={viewAllLink} 
            className="text-sm text-orange-600 hover:underline font-semibold"
          >
            See All →
          </a>
        )}
      </div>

      {/* Carousel Container */}
      <div className="relative group">
        
        {/* Scroll Container */}
        <div
          ref={scrollContainerRef}
          onScroll={updateArrows}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {/* Cards with fixed width */}
          {Array.isArray(children) ? (
            children.map((child, index) => (
              <div 
                key={index} 
                className="flex-shrink-0"
                style={{ 
                  width: '280px',
                  minWidth: '280px'
                }}
              >
                {child}
              </div>
            ))
          ) : (
            <div 
              className="flex-shrink-0"
              style={{ 
                width: '280px',
                minWidth: '280px'
              }}
            >
              {children}
            </div>
          )}
        </div>

        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Scroll left"
          >
            <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
        )}

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Scroll right"
          >
            <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
