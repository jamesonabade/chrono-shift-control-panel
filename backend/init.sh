
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
    
    # Atualizar senhas se as variáveis de ambiente mudaram
    if [ ! -z "$ADMIN_PASSWORD" ] || [ ! -z "$USER_PASSWORD" ]; then
        log "🔐 Atualizando senhas a partir das variáveis de ambiente..."
        
        CONFIG_FILE="/app/data/system-config.json"
        if [ -f "$CONFIG_FILE" ]; then
            # Criar backup da configuração
            cp "$CONFIG_FILE" "$CONFIG_FILE.backup"
            
            # Atualizar senhas usando jq se disponível, senão usar sed
            if command -v jq >/dev/null 2>&1; then
                if [ ! -z "$ADMIN_PASSWORD" ]; then
                    jq ".users.administrador = \"$ADMIN_PASSWORD\"" "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
                    log "🔑 Senha do administrador atualizada via jq"
                fi
                
                if [ ! -z "$USER_PASSWORD" ]; then
                    jq ".users.usuario = \"$USER_PASSWORD\"" "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
                    log "🔑 Senha do usuário atualizada via jq"
                fi
                
                # Atualizar timestamp
                jq ".lastUpdated = \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\"" "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
            else
                warning "jq não disponível, usando sed..."
                if [ ! -z "$ADMIN_PASSWORD" ]; then
                    sed -i "s/\"administrador\": \"[^\"]*\"/\"administrador\": \"$ADMIN_PASSWORD\"/g" "$CONFIG_FILE"
                    log "🔑 Senha do administrador atualizada via sed"
                fi
                
                if [ ! -z "$USER_PASSWORD" ]; then
                    sed -i "s/\"usuario\": \"[^\"]*\"/\"usuario\": \"$USER_PASSWORD\"/g" "$CONFIG_FILE"
                    log "🔑 Senha do usuário atualizada via sed"
                fi
            fi
        fi
    fi
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

# Verificar saúde dos serviços externos
log "🔗 Verificando conectividade de rede..."
if ping -c 1 -W 2 google.com > /dev/null 2>&1; then
    log "   ✅ Conectividade externa: OK"
else
    warning "   ⚠️ Conectividade externa: Limitada"
fi

# Limpeza de logs antigos (manter últimos 30 dias)
log "🧹 Limpeza de logs antigos..."
find /app/logs -name "*.log" -type f -mtime +30 -delete 2>/dev/null || true

# Exibir informações do sistema
log "📊 Informações do sistema:"
log "   • Hostname: $(hostname)"
log "   • IP: $(hostname -i 2>/dev/null || echo 'N/A')"
log "   • Ambiente: ${NODE_ENV:-development}"
log "   • Porta: ${PORT:-3001}"
log "   • Domínio: ${DOMAIN:-localhost}"
log "   • Base Path: ${BASE_PATH:-/}"
log "   • Diretório de dados: ${DATA_DIR:-/app/data}"
log "   • Diretório de scripts: ${SCRIPTS_DIR:-/app/scripts}"
log "   • Timezone: $(date +%Z)"
log "   • Data/Hora: $(date)"

# Verificar espaço em disco
DISK_USAGE=$(df -h /app | awk 'NR==2{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    warning "   ⚠️ Espaço em disco baixo: ${DISK_USAGE}%"
else
    log "   • Espaço em disco: ${DISK_USAGE}% usado"
fi

# Executar servidor
log "🚀 Iniciando servidor Node.js..."
log "Sistema pronto para uso em: ${DOMAIN:-localhost}${BASE_PATH:-}"

exec node server.js
