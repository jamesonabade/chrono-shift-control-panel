
/**
 * Utilitário SIMPLIFICADO para endpoints da API
 * Configuração automática e direta para produção
 */

interface ApiConfig {
  baseUrl: string;
  healthUrl: string;
  environment: 'development' | 'production';
}

/**
 * Configuração SIMPLES e DIRETA da API
 */
export const getApiConfig = (): ApiConfig => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  console.log('🔍 Detectando ambiente da API (SIMPLIFICADO):');
  console.log(`  URL atual: ${window.location.href}`);
  
  // 1. DESENVOLVIMENTO LOCAL (localhost:8080)
  if (hostname === 'localhost' && port === '8080') {
    const config: ApiConfig = {
      baseUrl: 'http://localhost:3001',
      healthUrl: 'http://localhost:3001/api/health',
      environment: 'development'
    };
    console.log('✅ DESENVOLVIMENTO LOCAL detectado');
    return config;
  }
  
  // 2. PRODUÇÃO (qualquer domínio não-localhost)
  const baseUrl = `${protocol}//${hostname}${port && port !== '80' && port !== '443' ? `:${port}` : ''}`;
  const config: ApiConfig = {
    baseUrl,
    healthUrl: `${baseUrl}/scripts/api/health`,
    environment: 'production'
  };
  
  console.log('✅ PRODUÇÃO detectado');
  console.log(`  Base URL: ${config.baseUrl}`);
  console.log(`  API Health: ${config.healthUrl}`);
  
  return config;
};

/**
 * Retorna a URL completa para um endpoint específico
 */
export const getApiEndpoint = (endpoint: string): string => {
  const config = getApiConfig();
  
  // Para desenvolvimento local
  if (config.environment === 'development') {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${config.baseUrl}${cleanEndpoint}`;
  }
  
  // Para produção - SEMPRE usar /scripts/api
  const cleanEndpoint = endpoint.replace(/^\/?(api\/)?/, '');
  const fullEndpoint = `/scripts/api/${cleanEndpoint}`;
  
  console.log(`🌐 Endpoint: ${endpoint} → ${fullEndpoint}`);
  return fullEndpoint;
};

/**
 * Retorna a URL do health check
 */
export const getHealthCheckUrl = (): string => {
  return getApiConfig().healthUrl;
};

/**
 * Hook SIMPLES para configuração da API
 */
export const useApiConfig = () => {
  const config = getApiConfig();
  
  return {
    ...config,
    getEndpoint: (endpoint: string) => getApiEndpoint(endpoint),
    isLocal: config.environment === 'development',
    isProduction: config.environment === 'production'
  };
};
