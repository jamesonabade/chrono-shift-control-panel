
#!/bin/bash
set -e

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

log "🔧 Configurando variáveis de ambiente..."
log "   • NODE_ENV: ${NODE_ENV:-production}"
log "   • PORT: ${PORT:-3001}"
log "   • DOMAIN: ${DOMAIN:-localhost}"
log "   • BASE_PATH: ${BASE_PATH:-/}"
log "   • DB_HOST: ${DB_HOST:-database}"
log "   • DB_NAME: ${DB_NAME:-sistema_db}"
log "   • DB_USER: ${DB_USER:-sistema_user}"

# Aguardar banco de dados
if [ -n "$DB_HOST" ]; then
    log "🗄️ Aguardando banco de dados PostgreSQL..."
    RETRY_COUNT=0
    MAX_RETRIES=30
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if pg_isready -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" > /dev/null 2>&1; then
            log "✅ Banco de dados PostgreSQL está disponível"
            break
        else
            RETRY_COUNT=$((RETRY_COUNT + 1))
            log "⏳ Tentativa $RETRY_COUNT/$MAX_RETRIES - Aguardando banco de dados..."
            sleep 5
        fi
    done
    
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        error "❌ Banco de dados não respondeu após $MAX_RETRIES tentativas"
        exit 1
    fi
    
    # Testar conexão com o banco
    log "🔍 Testando conexão com o banco de dados..."
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        log "✅ Conexão com banco de dados estabelecida com sucesso"
    else
        error "❌ Falha na conexão com o banco de dados"
        exit 1
    fi
else
    log "ℹ️ Variáveis de banco de dados não configuradas, pulando verificação"
fi

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
    cat > /app/data/system-config.json << EOF
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
EOF
    
    # Configurar logs iniciais
    log "📝 Configurando logs do sistema..."
    cat > /app/logs/system.log << EOF
[$(date '+%Y-%m-%d %H:%M:%S')] Sistema inicializado em produção
[$(date '+%Y-%m-%d %H:%M:%S')] Domínio: ${DOMAIN:-localhost}
[$(date '+%Y-%m-%d %H:%M:%S')] Base Path: ${BASE_PATH:-/}
[$(date '+%Y-%m-%d %H:%M:%S')] Ambiente: ${NODE_ENV:-production}
EOF
    
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
log "   • IP: $(hostname -i 2>/dev/null || echo 'N/A')"
log "   • Ambiente: ${NODE_ENV:-development}"
log "   • Porta: ${PORT:-3001}"
log "   • Domínio: ${DOMAIN:-localhost}"
log "   • Base Path: ${BASE_PATH:-/}"

log "🏥 Configurando health check endpoint..."

# Executar servidor
log "🚀 Iniciando servidor Node.js..."
log "Sistema backend pronto para uso em: ${DOMAIN:-localhost}${BASE_PATH:-}"

exec node server.js
