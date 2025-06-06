
/**
 * Utilitário para detecção automática de endpoints da API
 * Funciona em diferentes ambientes: desenvolvimento, Docker e produção
 */

interface ApiConfig {
  baseUrl: string;
  healthUrl: string;
  environment: 'development' | 'docker' | 'production';
}

/**
 * Detecta automaticamente o ambiente e retorna a configuração apropriada da API
 */
export const getApiConfig = (): ApiConfig => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;
  const pathname = window.location.pathname;
  
  console.log('🔍 Detectando ambiente da API:');
  console.log(`  Hostname: ${hostname}`);
  console.log(`  Protocol: ${protocol}`);
  console.log(`  Port: ${port}`);
  console.log(`  Pathname: ${pathname}`);
  
  // 1. DESENVOLVIMENTO LOCAL (fora do Docker)
  if ((hostname === 'localhost' || hostname === '127.0.0.1') && port === '8080') {
    const config: ApiConfig = {
      baseUrl: 'http://localhost:3001',
      healthUrl: 'http://localhost:3001/api/health',
      environment: 'development'
    };
    console.log('✅ Ambiente: DESENVOLVIMENTO LOCAL');
    console.log(`  API Base URL: ${config.baseUrl}`);
    return config;
  }
  
  // 2. DOCKER COMPOSE LOCAL (nginx + containers)
  if ((hostname === 'localhost' || hostname === '127.0.0.1') && (port === '80' || port === '')) {
    const config: ApiConfig = {
      baseUrl: `${protocol}//${hostname}${port ? `:${port}` : ''}`,
      healthUrl: `${protocol}//${hostname}${port ? `:${port}` : ''}/api/health`,
      environment: 'docker'
    };
    console.log('✅ Ambiente: DOCKER COMPOSE LOCAL');
    console.log(`  API Base URL: ${config.baseUrl}`);
    return config;
  }
  
  // 3. PRODUÇÃO (domínio personalizado)
  // Detectar se há um contexto/subpath (ex: /scripts)
  let basePath = '';
  const envBasePath = import.meta.env.VITE_BASE_PATH;
  
  if (envBasePath && envBasePath !== '/') {
    basePath = envBasePath;
  } else {
    // Tentar detectar contexto pela URL atual
    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments.length > 0 && !pathSegments[0].includes('.')) {
      basePath = `/${pathSegments[0]}`;
    }
  }
  
  const config: ApiConfig = {
    baseUrl: `${protocol}//${hostname}`,
    healthUrl: `${protocol}//${hostname}${basePath}/api/health`,
    environment: 'production'
  };
  
  console.log('✅ Ambiente: PRODUÇÃO');
  console.log(`  Base Path: ${basePath || '(raiz)'}`);
  console.log(`  API Base URL: ${config.baseUrl}`);
  console.log(`  Health URL: ${config.healthUrl}`);
  
  return config;
};

/**
 * Retorna a URL base da API para o ambiente atual
 */
export const getApiBaseUrl = (): string => {
  const config = getApiConfig();
  const basePath = import.meta.env.VITE_BASE_PATH;
  
  // Para produção com subpath
  if (config.environment === 'production' && basePath && basePath !== '/') {
    return `${config.baseUrl}${basePath}`;
  }
  
  return config.baseUrl;
};

/**
 * Retorna a URL completa para um endpoint específico
 */
export const getApiEndpoint = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

/**
 * Retorna a URL do health check
 */
export const getHealthCheckUrl = (): string => {
  return getApiConfig().healthUrl;
};

/**
 * Hook para obter informações da API de forma reativa
 */
export const useApiConfig = () => {
  const config = getApiConfig();
  
  return {
    ...config,
    getEndpoint: (endpoint: string) => getApiEndpoint(endpoint),
    isLocal: config.environment === 'development',
    isDocker: config.environment === 'docker',
    isProduction: config.environment === 'production'
  };
};
