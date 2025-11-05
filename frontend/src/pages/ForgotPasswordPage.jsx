import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/users/forgot_password/', {
        email: email
      });

      setMessage(response.data.message);
      setEmailSent(true);
      setEmail(''); // Clear the form
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send password reset email. Please try again.');
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
          <p className="text-sm sm:text-base text-gray-600">
            {emailSent ? 'Check Your Email' : 'Reset Your Password'}
          </p>
        </div>

        {/* Forgot Password Card - Mobile Responsive */}
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          {emailSent ? (
            // Success Message
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Email Sent!</h2>
                <p className="text-gray-600 mb-4">{message}</p>
                <p className="text-sm text-gray-500 mb-6">
                  Please check your email inbox and click the password reset link. The link will expire in 1 hour.
                </p>
              </div>

              <div className="space-y-3">
                <Link
                  to="/login"
                  className="block w-full bg-orange-600 text-white py-2.5 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                >
                  Back to Login
                </Link>
                <button
                  onClick={() => {
                    setEmailSent(false);
                    setMessage('');
                  }}
                  className="block w-full text-orange-600 py-2.5 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
                >
                  Resend Email
                </button>
              </div>
            </div>
          ) : (
            // Form
            <>
              <div className="mb-6">
                <p className="text-gray-600 text-sm sm:text-base">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4 text-sm">
                  {error}
                </div>
              )}

              {message && !emailSent && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded mb-4 text-sm">
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Email - Mobile Responsive */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>

                {/* Submit Button - Mobile Responsive */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-600 text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              {/* Back to Login */}
              <div className="mt-6 text-center">
                <Link to="/login" className="text-gray-600 hover:text-orange-600 text-sm">
                  ← Back to Login
                </Link>
              </div>
            </>
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
