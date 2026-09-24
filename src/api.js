import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://nawalaredirect-backend-production.up.railway.app';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('nawala_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('nawala_token');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (username, password) => api.post('/api/auth/login', { username, password }),
  verify: () => api.get('/api/auth/verify'),
};

export const domainAPI = {
  getAll: (group) => api.get('/api/domains', { params: group ? { group } : {} }),
  getStats: () => api.get('/api/domains/stats'),
  getGroups: () => api.get('/api/domains/groups'),
  add: (url, label, group_name) => api.post('/api/domains', { url, label, group_name }),
  update: (id, data) => api.put(`/api/domains/${id}`, data),
  setGroup: (id, group_name) => api.put(`/api/domains/${id}/group`, { group_name }),
  delete: (id) => api.delete(`/api/domains/${id}`),
  checkOne: (id) => api.post(`/api/domains/${id}/check`),
  checkAll: () => api.post('/api/domains/check-all'),
  checkISP: (id) => api.post(`/api/domains/${id}/check-isp`),
  checkAllISP: () => api.post('/api/domains/check-all-isp'),

};

export default api;

export const statsAPI = {
  getDetailed: () => api.get('/api/domains/stats/detailed'),
};
