// Token storage and management utilities

const TOKEN_KEY = 'bidmarket_access_token';
const REFRESH_TOKEN_KEY = 'bidmarket_refresh_token';
const USER_KEY = 'bidmarket_user';

export const authUtils = {
  // Store tokens after login
  setTokens(accessToken, refreshToken) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  // Get access token
  getAccessToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Get refresh token
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  // Store user data
  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  // Get user data
  getUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getAccessToken();
  },

  // Clear all auth data (logout)
  clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  // Get auth header for API requests
  getAuthHeader() {
    const token = this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
};