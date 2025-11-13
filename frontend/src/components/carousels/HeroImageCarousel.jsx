import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '../../api/axios';

export default function HeroImageCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Fetch hero banners from API
  const { data } = useQuery({
    queryKey: ['hero-banners'],
    queryFn: async () => {
      const res = await axios.get('/hero-banners/');
      // Handle paginated response
      if (res.data.results && Array.isArray(res.data.results)) {
        return res.data.results;
      }
      // Handle direct array response
      if (Array.isArray(res.data)) {
        return res.data;
      }
      // Fallback to empty array
      return [];
    },
  });

  const banners = Array.isArray(data) ? data : [];

  // Use banners from API, or default if none exist
  const slides = banners.length > 0 ? banners.map(banner => ({
    id: banner.id,
    image: banner.image_url || banner.image,
    title: banner.title,
    subtitle: banner.subtitle,
    cta: banner.cta_text,
    link: banner.cta_link,
  })) : [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=500&fit=crop',
      title: 'Welcome to BidSoko',
      subtitle: 'Your Ultimate Bidding Marketplace',
      cta: 'Browse Products',
      link: '/browse',
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=1200&h=500&fit=crop',
      title: 'Save Up to 70% with Bidding',
      subtitle: 'Compete with others and win amazing products at unbeatable prices',
      cta: 'Learn How to Bid',
      link: '/browse',
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&h=500&fit=crop',
      title: 'Shop with Confidence',
      subtitle: 'Secure payments with M-Pesa • Fast delivery • 7-day returns',
      cta: 'Shop Now',
      link: '/browse',
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="hero-image-carousel relative rounded-lg overflow-hidden shadow-xl bg-white mb-4 sm:mb-6">
      {/* Slides */}
      <div className="relative h-[300px] sm:h-[400px] lg:h-[500px]">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Background Image - No Overlay */}
            <div className="relative w-full h-full">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content Overlay - Semi-transparent background for text readability */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-4 sm:px-8 max-w-4xl bg-black/40 rounded-xl p-6 sm:p-8">
                <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black text-white mb-3 sm:mb-4">
                  {slide.title}
                </h2>
                <p className="text-lg sm:text-xl lg:text-2xl text-white mb-6 sm:mb-8 font-medium">
                  {slide.subtitle}
                </p>
                <Link
                  to={slide.link}
                  className="inline-block bg-white text-gray-900 px-6 sm:px-10 py-3 sm:py-4 rounded-full text-base sm:text-lg font-bold hover:bg-gray-100 transition-all transform hover:scale-105"
                >
                  {slide.cta}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 p-2 sm:p-3 rounded-full shadow-lg transition-all hover:scale-110"
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 p-2 sm:p-3 rounded-full shadow-lg transition-all hover:scale-110"
            aria-label="Next slide"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-white w-6 sm:w-8'
                  : 'bg-white/60 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
