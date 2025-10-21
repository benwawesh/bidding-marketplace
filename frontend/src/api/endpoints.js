import axios from './axios';

const API_URL = 'http://127.0.0.1:8000/api';

export const auctionsAPI = {
  getAll: () => axios.get(`${API_URL}/auctions/`),
  getById: (id) => axios.get(`${API_URL}/auctions/${id}/`),
  create: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
        formData.append(key, data[key]);
      }
    });
    return axios.post(`${API_URL}/auctions/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (id, data) => axios.put(`${API_URL}/auctions/${id}/`, data),
  activate: (id, data) => axios.post(`${API_URL}/auctions/${id}/activate/`, data),
  close: (id) => axios.post(`${API_URL}/auctions/${id}/close/`),
  getLeaderboard: (id) => axios.get(`${API_URL}/auctions/${id}/leaderboard/`),
  getRounds: (id) => axios.get(`${API_URL}/auctions/${id}/rounds/`),
  // NEW: Admin management endpoints
  getParticipants: (id) => axios.get(`${API_URL}/auctions/${id}/participants/`),
  getBidsList: (id) => axios.get(`${API_URL}/auctions/${id}/bids_list/`),
  getRevenueSummary: (id) => axios.get(`${API_URL}/auctions/${id}/revenue_summary/`),
  // Buy Now product management
  getBuyers: (id) => axios.get(`${API_URL}/auctions/${id}/buyers/`),
  getSalesStats: (id) => axios.get(`${API_URL}/auctions/${id}/sales_stats/`),
};

export const categoriesAPI = {
  getAll: () => axios.get(`${API_URL}/categories/`),
  getById: (id) => axios.get(`${API_URL}/categories/${id}/`),
  create: (data) => axios.post(`${API_URL}/categories/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => axios.put(`${API_URL}/categories/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => axios.delete(`${API_URL}/categories/${id}/`),
  toggleActive: (id) => axios.post(`${API_URL}/categories/${id}/toggle_active/`),
};

export const bidsAPI = {
  create: (data) => axios.post(`${API_URL}/bids/`, data),
  getMyBids: () => axios.get(`${API_URL}/bids/`),
};

export const participationsAPI = {
  create: (data) => axios.post(`${API_URL}/participations/`, data),
  getMy: () => axios.get(`${API_URL}/participations/my_participations/`),
};

export const ordersAPI = {
  getAll: () => axios.get(`${API_URL}/orders/`),
  getById: (id) => axios.get(`${API_URL}/orders/${id}/`),
  create: (data) => axios.post(`${API_URL}/orders/`, data),
  updateStatus: (id, data) => axios.patch(`${API_URL}/orders/${id}/update_status/`, data),
  getStats: () => axios.get(`${API_URL}/orders/stats/`),
};

export const cartAPI = {
  getCart: () => axios.get(`${API_URL}/cart/`),
  addToCart: (data) => axios.post(`${API_URL}/cart/add/`, data),
  updateQuantity: (data) => axios.post(`${API_URL}/cart/update_quantity/`, data),
  removeItem: (itemId) => axios.post(`${API_URL}/cart/remove/`, { item_id: itemId }),
  clearCart: () => axios.post(`${API_URL}/cart/clear/`),
};

export const customersAPI = {
  getAll: () => axios.get(`${API_URL}/customers/`),
  getById: (id) => axios.get(`${API_URL}/customers/${id}/`),
};

export const usersAPI = {
  register: (data) => axios.post('http://127.0.0.1:8000/accounts/api/users/', data),
  getMe: () => axios.get('http://127.0.0.1:8000/accounts/api/users/me/'),
  updateProfile: (data) => axios.patch('http://127.0.0.1:8000/accounts/api/users/update_profile/', data),
  // Admin endpoints
  adminList: (params) => axios.get('http://127.0.0.1:8000/accounts/api/users/admin_list/', { params }),
  adminDetail: (id) => axios.get(`http://127.0.0.1:8000/accounts/api/users/${id}/admin_detail/`),
  adminStats: () => axios.get('http://127.0.0.1:8000/accounts/api/users/admin_stats/'),
};
