
// Configuração dinâmica para produção
window.APP_CONFIG = {
  API_URL: window.location.origin.replace(':8080', ':3001') // Fallback padrão
};
