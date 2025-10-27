import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-orange-500">404</h1>
          <div className="mt-4">
            <svg 
              className="mx-auto h-32 w-32 text-gray-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="1.5" 
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Oops! Page Not Found
        </h2>
        <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved. 
          Let's get you back on track!
        </p>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Link 
            to="/" 
            className="inline-block bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition"
          >
            ← Back to Home
          </Link>
          <Link 
            to="/browse" 
            className="inline-block bg-white text-orange-600 border-2 border-orange-500 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition"
          >
            Browse Products
          </Link>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-gray-200 max-w-md mx-auto">
          <p className="text-sm text-gray-600 mb-4">Quick Links:</p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link to="/" className="text-orange-600 hover:underline">Home</Link>
            <Link to="/browse" className="text-orange-600 hover:underline">Browse</Link>
            <Link to="/cart" className="text-orange-600 hover:underline">Cart</Link>
          </div>
        </div>
      </div>
    </div>
  );
}