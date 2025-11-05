import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing verification token.');
      setLoading(false);
      return;
    }

    // Automatically verify on page load
    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/accounts/api/users/verify_email/', {
        token: token
      });

      setMessage(response.data.message);
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { state: { message: 'Email verified successfully! Please login to continue.' } });
      }, 3000);

    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to verify email. The link may be expired or invalid.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-8 sm:py-12 px-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand - Mobile Responsive */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-orange-600 mb-2">BidSoko</h1>
          <p className="text-sm sm:text-base text-gray-600">Email Verification</p>
        </div>

        {/* Verification Card - Mobile Responsive */}
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          {loading ? (
            // Loading State
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto"></div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying Your Email...</h2>
              <p className="text-gray-600">Please wait while we verify your email address.</p>
            </div>
          ) : success ? (
            // Success State
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Email Verified!</h2>
                <p className="text-gray-600 mb-4">{message}</p>
                <p className="text-sm text-gray-500 mb-6">
                  Redirecting to login page in 3 seconds...
                </p>
              </div>

              <Link
                to="/login"
                className="block w-full bg-orange-600 text-white py-2.5 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            // Error State
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h2>
                <p className="text-red-600 mb-4">{error}</p>
                <p className="text-sm text-gray-500 mb-6">
                  The verification link may have expired or is invalid. You can request a new verification email below.
                </p>
              </div>

              <div className="space-y-3">
                <Link
                  to="/resend-verification"
                  className="block w-full bg-orange-600 text-white py-2.5 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                >
                  Resend Verification Email
                </Link>
                <Link
                  to="/login"
                  className="block w-full text-orange-600 py-2.5 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Back to Home */}
        <div className="text-center mt-4">
          <Link to="/" className="text-gray-600 hover:text-orange-600 text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
