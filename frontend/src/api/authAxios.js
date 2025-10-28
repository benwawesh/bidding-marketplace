import axios from 'axios';

// Separate axios instance for accounts/auth endpoints (no /api prefix)
const authApi = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add JWT token to all requests
authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bidmarket_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh on 401 errors
authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('bidmarket_refresh_token');
        const response = await axios.post('/accounts/api/token/refresh/', {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('bidmarket_access_token', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return authApi(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect to login
        localStorage.removeItem('bidmarket_access_token');
        localStorage.removeItem('bidmarket_refresh_token');
        localStorage.removeItem('bidmarket_user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default authApi;
