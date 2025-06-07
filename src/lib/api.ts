
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de respostas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Tipos para as respostas da API
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginatedResponse<T> extends ApiResponse<{
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> {}

// Serviços da API
export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ token: string; user: any }>>('/auth/login', { email, password }),
  
  logout: () =>
    api.post<ApiResponse>('/auth/logout'),
  
  me: () =>
    api.get<ApiResponse<{ user: any }>>('/auth/me'),
};

export const userApi = {
  getUsers: (params?: any) =>
    api.get<ApiResponse<{ users: any[]; pagination: any }>>('/users', { params }),
  
  createUser: (userData: any) =>
    api.post<ApiResponse<{ user: any }>>('/users', userData),
  
  updateUser: (id: string, userData: any) =>
    api.put<ApiResponse<{ user: any }>>(`/users/${id}`, userData),
  
  deleteUser: (id: string) =>
    api.delete<ApiResponse>(`/users/${id}`),
};

export const configApi = {
  getConfigs: (params?: any) =>
    api.get<ApiResponse<{ configs: any[] }>>('/config', { params }),
  
  updateConfig: (configData: any) =>
    api.put<ApiResponse<{ config: any }>>('/config', configData),
  
  deleteConfig: (key: string) =>
    api.delete<ApiResponse>(`/config/${key}`),
};

export const logApi = {
  getLogs: (params?: any) =>
    api.get<ApiResponse<{ logs: any[]; pagination: any }>>('/logs', { params }),
  
  getLogStats: (params?: any) =>
    api.get<ApiResponse<any>>('/logs/stats', { params }),
};
