
import axios from 'axios';

// Detectar automaticamente a URL da API baseado no ambiente
const getApiUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  console.log('🔍 Detectando URL da API:', { hostname, protocol, port });
  
  // Se estiver acessando via localhost:8080 (desenvolvimento direto)
  if ((hostname === 'localhost' || hostname === '127.0.0.1') && port === '8080') {
    console.log('📡 Usando URL direta do backend para desenvolvimento local');
    return 'http://localhost:3001';
  }
  
  // Se estiver acessando via nginx (porta 80 ou qualquer outro IP/hostname)
  console.log('📡 Usando URL via nginx proxy');
  return `${protocol}//${hostname}${port && port !== '80' && port !== '443' ? ':' + port : ''}`;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || getApiUrl();

console.log('🔗 API URL configurada:', API_BASE_URL);

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('📡 Fazendo requisição para:', config.baseURL + config.url);
    console.log('📡 Headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('❌ Erro na configuração da requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de respostas
api.interceptors.response.use(
  (response) => {
    console.log('✅ Resposta recebida:', response.status, response.config.url);
    console.log('✅ Dados da resposta:', response.data);
    return response;
  },
  (error) => {
    console.error('❌ Erro na resposta:', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      console.log('🔒 Token inválido, redirecionando para login');
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      window.location.href = '/';
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

export const dateActionApi = {
  create: (data: { date: string; variables?: any }) =>
    api.post<ApiResponse<{ dateAction: any }>>('/date-actions', data),
  
  getLast: () =>
    api.get<ApiResponse<{ lastAction: any }>>('/date-actions/last'),
  
  getAll: (params?: any) =>
    api.get<ApiResponse<{ actions: any[]; pagination: any }>>('/date-actions', { params }),
};

export const databaseActionApi = {
  create: (data: { environment: string; variables?: any }) =>
    api.post<ApiResponse<{ databaseAction: any }>>('/database-actions', data),
  
  getLast: () =>
    api.get<ApiResponse<{ lastAction: any }>>('/database-actions/last'),
  
  getAll: (params?: any) =>
    api.get<ApiResponse<{ actions: any[]; pagination: any }>>('/database-actions', { params }),
};

export const customizationApi = {
  get: () =>
    api.get<ApiResponse<any>>('/customizations'),
  
  update: (data: any) =>
    api.put<ApiResponse<{ customization: any }>>('/customizations', data),
};

// Serviço para verificar conexão com o servidor
export const serverApi = {
  getServerTime: () =>
    api.get<ApiResponse<{ serverTime: string; timezone: string }>>('/server-time'),
  
  healthCheck: () =>
    api.get<ApiResponse>('/health'),
};
