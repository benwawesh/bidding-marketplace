import axios from 'axios';
import { authUtils } from '../utils/auth';

const AUTH_BASE_URL = 'http://127.0.0.1:8000';

export const authAPI = {
  async register(userData) {
    const response = await axios.post(`${AUTH_BASE_URL}/accounts/api/users/`, {
      ...userData,
      user_type: 'buyer'
    });
    return response;
  },

  async login(username, password) {
    const response = await axios.post(`${AUTH_BASE_URL}/accounts/api/token/`, {
      username,
      password
    });
    return response;
  },

  async refreshToken() {
    const refreshToken = authUtils.getRefreshToken();
    const response = await axios.post(`${AUTH_BASE_URL}/accounts/api/token/refresh/`, {
      refresh: refreshToken
    });
    return response;
  },

  async getProfile() {
    const response = await axios.get(`${AUTH_BASE_URL}/accounts/api/users/me/`, {
      headers: authUtils.getAuthHeader()
    });
    return response;
  },

  async updateProfile(data) {
    const response = await axios.patch(`${AUTH_BASE_URL}/accounts/api/users/update_profile/`, data, {
      headers: authUtils.getAuthHeader()
    });
    return response;
  },

  async getStats() {
    const response = await axios.get(`${AUTH_BASE_URL}/accounts/api/users/stats/`, {
      headers: authUtils.getAuthHeader()
    });
    return response;
  }
};
