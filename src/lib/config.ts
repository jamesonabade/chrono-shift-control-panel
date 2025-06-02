
// Configuração da API baseada no ambiente
const getApiUrl = (): string => {
  // Em desenvolvimento, usar variável de ambiente
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }
  
  // Em produção, verificar se existe configuração dinâmica
  if (typeof window !== 'undefined' && (window as any).APP_CONFIG) {
    return (window as any).APP_CONFIG.API_URL;
  }
  
  // Fallback para produção - assumir mesma origem com porta 3001
  const currentOrigin = window.location.origin;
  return currentOrigin.replace(':8080', ':3001');
};

export const API_URL = getApiUrl();

console.log('API URL configured:', API_URL);
