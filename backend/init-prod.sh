
#!/bin/bash

echo "🚀 Iniciando configuração do sistema de produção..."

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

# Verificar se é primeira execução
FIRST_RUN_FILE="/app/data/.first_run_complete"

# Aguardar um pouco para outros serviços iniciarem
sleep 5

if [ ! -f "$FIRST_RUN_FILE" ]; then
    log "🎯 Primeira execução detectada - configurando sistema..."
    
    # Criar diretórios necessários
    log "📁 Criando estrutura de diretórios..."
    mkdir -p /app/data /app/scripts /app/logs /app/uploads
    
    # Definir permissões
    log "🔒 Configurando permissões..."
    chmod 755 /app/data /app/scripts /app/logs /app/uploads
    
    # Criar configuração inicial do sistema
    log "⚙️ Criando configuração inicial..."
    cat > /app/data/system-config.json << 'EOJ'
{
  "version": "1.0.0",
  "initialized": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "environment": "${NODE_ENV:-production}",
  "domain": "${DOMAIN:-localhost}",
  "basePath": "${BASE_PATH:-}",
  "users": {
    "administrador": "${ADMIN_PASSWORD:-admin123}",
    "usuario": "${USER_PASSWORD:-user123}"
  },
  "customizations": {
    "title": "${SYSTEM_TITLE:-PAINEL DE CONTROLE}",
    "subtitle": "${SYSTEM_SUBTITLE:-Sistema de Gerenciamento Docker}",
    "background": "",
    "logo": "",
    "favicon": ""
  },
  "systemVariables": {
    "NODE_ENV": "${NODE_ENV:-production}",
    "DOMAIN": "${DOMAIN:-localhost}",
    "BASE_PATH": "${BASE_PATH:-}",
    "CORS_ORIGIN": "${CORS_ORIGIN:-*}"
  },
  "lastUpdated": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)"
}
EOJ
    
    # Configurar logs iniciais
    log "📝 Configurando logs do sistema..."
    cat > /app/logs/system.log << 'EOL'
[$(date '+%Y-%m-%d %H:%M:%S')] Sistema inicializado em produção
[$(date '+%Y-%m-%d %H:%M:%S')] Domínio: ${DOMAIN:-localhost}
[$(date '+%Y-%m-%d %H:%M:%S')] Base Path: ${BASE_PATH:-/}
[$(date '+%Y-%m-%d %H:%M:%S')] Ambiente: ${NODE_ENV:-production}
EOL
    
    # Marcar primeira execução como concluída
    touch "$FIRST_RUN_FILE"
    echo "$(date '+%Y-%m-%d %H:%M:%S')" > "$FIRST_RUN_FILE"
    log "✅ Configuração inicial concluída!"
else
    log "🔄 Sistema já configurado - carregando configurações existentes..."
fi

# Verificar conectividade com Docker
log "🐳 Verificando conectividade com Docker..."
if docker version > /dev/null 2>&1; then
    log "✅ Docker conectado com sucesso"
    docker --version | sed 's/^/   • /'
else
    error "❌ Não foi possível conectar ao Docker"
    warning "Verifique se o socket do Docker está montado corretamente"
fi

# Verificar e criar volumes se necessário
log "💾 Verificando volumes de dados..."
for dir in data scripts logs uploads; do
    if [ -d "/app/$dir" ] && [ -w "/app/$dir" ]; then
        log "   ✅ Volume $dir: OK"
    else
        warning "   ⚠️ Volume $dir: Problema de acesso"
        mkdir -p "/app/$dir" 2>/dev/null || true
        chmod 755 "/app/$dir" 2>/dev/null || true
    fi
done

# Exibir informações do sistema
log "📊 Informações do sistema:"
log "   • Hostname: $(hostname)"
log "   • Ambiente: ${NODE_ENV:-development}"
log "   • Porta: ${PORT:-3001}"
log "   • Domínio: ${DOMAIN:-localhost}"
log "   • Base Path: ${BASE_PATH:-/}"

# Executar servidor
log "🚀 Iniciando servidor Node.js..."
log "Sistema pronto para uso em: ${DOMAIN:-localhost}${BASE_PATH:-}"

exec node server.js
