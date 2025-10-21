import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/authAPI';
import { authUtils } from '../utils/auth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = authUtils.getAccessToken();
      const savedUser = authUtils.getUser();

      if (token && savedUser) {
        // User has token, fetch fresh profile
        try {
          const response = await authAPI.getProfile();
          setUser(response.data);
          authUtils.setUser(response.data);
        } catch (error) {
          // Token might be expired, clear auth
          authUtils.clearAuth();
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Login function
  const login = async (username, password) => {
    try {
      // Get tokens
      const tokenResponse = await authAPI.login(username, password);
      const { access, refresh } = tokenResponse.data;

      // Store tokens
      authUtils.setTokens(access, refresh);

      // Get user profile
      const profileResponse = await authAPI.getProfile();
      const userData = profileResponse.data;

      // Store user and update state
      authUtils.setUser(userData);
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.detail || 'Invalid username or password';
      return { success: false, error: message };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      // Register user
      const registerResponse = await authAPI.register(userData);

      // Auto-login after registration
      const loginResult = await login(userData.username, userData.password);

      return loginResult;
    } catch (error) {
      const errors = error.response?.data || {};
      const message = errors.username?.[0] || errors.email?.[0] || 'Registration failed';
      return { success: false, error: message, errors };
    }
  };

  // Logout function
  const logout = () => {
    authUtils.clearAuth();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}