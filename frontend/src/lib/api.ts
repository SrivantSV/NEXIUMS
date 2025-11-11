import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// API methods
export const authApi = {
  register: (data: { email: string; password: string; name?: string }) =>
    api.post('/api/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
};

export const artifactsApi = {
  create: (data: any) => api.post('/api/artifacts', data),
  list: (params?: any) => api.get('/api/artifacts', { params }),
  get: (id: string) => api.get(`/api/artifacts/${id}`),
  update: (id: string, data: any) => api.put(`/api/artifacts/${id}`, data),
  delete: (id: string) => api.delete(`/api/artifacts/${id}`),
  execute: (id: string, input?: any) =>
    api.post(`/api/artifacts/${id}/execute`, { input }),
  getVersions: (id: string) => api.get(`/api/artifacts/${id}/versions`),
  revert: (id: string, versionId: string) =>
    api.post(`/api/artifacts/${id}/versions/${versionId}/revert`),
};

export const executionsApi = {
  list: (params?: any) => api.get('/api/executions', { params }),
  get: (id: string) => api.get(`/api/executions/${id}`),
  cancel: (id: string) => api.post(`/api/executions/${id}/cancel`),
};

export const templatesApi = {
  list: (params?: any) => api.get('/api/templates', { params }),
  get: (id: string) => api.get(`/api/templates/${id}`),
  use: (id: string, data: any) => api.post(`/api/templates/${id}/use`, data),
};

export const shareApi = {
  create: (data: any) => api.post('/api/share', data),
  get: (shareCode: string, password?: string) =>
    api.get(`/api/share/${shareCode}`, { data: { password } }),
  delete: (id: string) => api.delete(`/api/share/${id}`),
};
