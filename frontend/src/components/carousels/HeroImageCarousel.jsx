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
    <div className="hero-image-carousel mb-4 md:mb-6">
      {/* Large Image Section */}
      <div className="relative rounded-t-lg overflow-hidden shadow-lg bg-gray-100">
        <div className="relative h-80 md:h-96 lg:h-[500px] xl:h-[600px]">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ${
                index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 p-2 md:p-3 rounded-full shadow-lg transition-all hover:scale-110"
              aria-label="Previous slide"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={nextSlide}
              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 p-2 md:p-3 rounded-full shadow-lg transition-all hover:scale-110"
              aria-label="Next slide"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Dots Indicator - On Image */}
        {slides.length > 1 && (
          <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 md:h-2.5 rounded-full transition-all ${
                  index === currentSlide
                    ? 'bg-white w-8 md:w-10'
                    : 'bg-white/60 w-2 md:w-2.5 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Separated Content Section Below Image */}
      <div className="bg-white rounded-b-lg shadow-lg p-4 md:p-6 lg:p-8">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`transition-opacity duration-700 ${
              index === currentSlide ? 'opacity-100 block' : 'opacity-0 hidden'
            }`}
          >
            <div className="max-w-4xl mx-auto">
              {/* Title */}
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
                {slide.title}
              </h2>

              {/* Subtitle */}
              <p className="text-sm md:text-base lg:text-lg text-gray-600 mb-4 md:mb-6 leading-relaxed">
                {slide.subtitle}
              </p>

              {/* CTA Button */}
              <Link
                to={slide.link}
                className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 md:px-8 md:py-4 rounded-lg text-sm md:text-base font-semibold transition-all hover:shadow-lg"
              >
                {slide.cta}
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
