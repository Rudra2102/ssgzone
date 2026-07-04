import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('saas_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('saas_admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/saas-admin/login', credentials),
  logout: () => {
    localStorage.removeItem('saas_admin_token');
    localStorage.removeItem('saas_app_id');
  },
};

export const dashboardAPI = {
  getStats: () => api.get('/saas-admin/dashboard/stats'),
  getRecentActivity: () => api.get('/saas-admin/activity'),
};

export const apiKeysAPI = {
  getKeys: () => api.get('/saas-admin/api-keys'),
  regenerateKey: (type) => api.post('/saas-admin/api-keys/regenerate', { type }),
  getWebhooks: () => api.get('/saas-admin/webhooks'),
  testWebhook: (url) => api.post('/saas-admin/webhooks/test', { url }),
};

export const tenantsAPI = {
  getAll: (params) => api.get('/saas-admin/tenants', { params }),
  create: (data) => api.post('/saas-admin/tenants', data),
  update: (id, data) => api.put(`/saas-admin/tenants/${id}`, data),
  delete: (id) => api.delete(`/saas-admin/tenants/${id}`),
  toggleStatus: (id) => api.patch(`/saas-admin/tenants/${id}/toggle-status`),
};

export default api;
