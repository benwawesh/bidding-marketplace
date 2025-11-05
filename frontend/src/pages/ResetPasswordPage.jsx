import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error on input
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/auth/users/reset_password/', {
        token: token,
        new_password: formData.newPassword
      });

      setMessage(response.data.message);
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { state: { message: 'Password reset successful! Please login with your new password.' } });
      }, 3000);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. Please try again or request a new reset link.');
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
            {success ? 'Password Reset Successful' : 'Create New Password'}
          </p>
        </div>

        {/* Reset Password Card - Mobile Responsive */}
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          {success ? (
            // Success Message
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Success!</h2>
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
            // Form
            <>
              <div className="mb-6">
                <p className="text-gray-600 text-sm sm:text-base">
                  Enter your new password below. Make sure it's at least 8 characters long.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* New Password - Mobile Responsive */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter new password (min 8 characters)"
                    minLength="8"
                  />
                </div>

                {/* Confirm Password - Mobile Responsive */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Confirm new password"
                    minLength="8"
                  />
                </div>

                {/* Password Strength Indicator */}
                {formData.newPassword && (
                  <div className="text-xs text-gray-500">
                    Password strength:
                    {formData.newPassword.length < 8 && <span className="text-red-600 ml-1">Too short</span>}
                    {formData.newPassword.length >= 8 && formData.newPassword.length < 12 && <span className="text-yellow-600 ml-1">Fair</span>}
                    {formData.newPassword.length >= 12 && <span className="text-green-600 ml-1">Good</span>}
                  </div>
                )}

                {/* Submit Button - Mobile Responsive */}
                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full bg-orange-600 text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Resetting Password...' : 'Reset Password'}
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
