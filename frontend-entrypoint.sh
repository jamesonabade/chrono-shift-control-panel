
#!/bin/bash

echo "🚀 Iniciando configuração do frontend..."

# Função para log colorido
log() {
    echo -e "\033[32m[$(date '+%Y-%m-%d %H:%M:%S')] $1\033[0m"
}

error() {
    echo -e "\033[31m[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1\033[0m"
}

warning() {
    echo -e "\033[33m[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1\033[0m"
}

log "🔧 Configurando variáveis de ambiente..."
log "   • NODE_ENV: ${NODE_ENV:-production}"
log "   • VITE_APP_ENV: ${VITE_APP_ENV:-production}"
log "   • VITE_API_URL: ${VITE_API_URL:-/api}"
log "   • VITE_BASE_PATH: ${VITE_BASE_PATH:-/}"
log "   • VITE_PUBLIC_URL: ${VITE_PUBLIC_URL:-}"

# Aguardar backend estar disponível
log "🔍 Aguardando backend ficar disponível..."
BACKEND_URL="${VITE_API_URL:-/api}/health"
RETRY_COUNT=0
MAX_RETRIES=30

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f -s "$BACKEND_URL" > /dev/null 2>&1; then
        log "✅ Backend está disponível"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        log "⏳ Tentativa $RETRY_COUNT/$MAX_RETRIES - Aguardando backend..."
        sleep 5
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    warning "⚠️ Backend não respondeu após $MAX_RETRIES tentativas, continuando mesmo assim..."
fi

log "🌐 Configurando nginx..."
log "   • Porta: 8080"
log "   • Base Path: ${VITE_BASE_PATH:-/}"

# Verificar configuração do nginx
if [ -f "/etc/nginx/conf.d/default.conf" ]; then
    log "✅ Configuração do nginx encontrada"
else
    error "❌ Configuração do nginx não encontrada"
fi

log "🏥 Configurando health check..."
echo "healthy" > /usr/share/nginx/html/health

log "📊 Informações do sistema:"
log "   • Hostname: $(hostname)"
log "   • IP: $(hostname -i 2>/dev/null || echo 'N/A')"
log "   • Timezone: $(date +%Z)"
log "   • Data/Hora: $(date)"

log "🚀 Iniciando nginx..."
log "Frontend pronto para uso!"

# Iniciar nginx
exec nginx -g 'daemon off;'
