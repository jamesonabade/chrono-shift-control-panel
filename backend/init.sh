
#!/bin/bash

echo "🚀 Iniciando configuração do sistema..."

# Função para log colorido
log() {
    echo -e "\033[32m[$(date '+%Y-%m-%d %H:%M:%S')] $1\033[0m"
}

error() {
    echo -e "\033[31m[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1\033[0m"
}

# Verificar se é primeira execução
FIRST_RUN_FILE="/app/data/.first_run_complete"

if [ ! -f "$FIRST_RUN_FILE" ]; then
    log "🎯 Primeira execução detectada - configurando sistema..."
    
    # Criar diretórios necessários
    log "📁 Criando estrutura de diretórios..."
    mkdir -p /app/data /app/scripts /app/logs /app/uploads
    
    # Definir permissões
    log "🔒 Configurando permissões..."
    chmod 755 /app/data /app/scripts /app/logs /app/uploads
    
    # Configurar senhas a partir de variáveis de ambiente
    if [ ! -z "$ADMIN_PASSWORD" ] || [ ! -z "$USER_PASSWORD" ]; then
        log "🔐 Configurando senhas personalizadas..."
        
        CONFIG_FILE="/app/data/system-config.json"
        if [ -f "$CONFIG_FILE" ]; then
            # Atualizar senhas no arquivo de configuração
            if [ ! -z "$ADMIN_PASSWORD" ]; then
                log "🔑 Atualizando senha do administrador..."
                sed -i "s/\"administrador\": \"[^\"]*\"/\"administrador\": \"$ADMIN_PASSWORD\"/g" "$CONFIG_FILE"
            fi
            
            if [ ! -z "$USER_PASSWORD" ]; then
                log "🔑 Atualizando senha do usuário..."
                sed -i "s/\"usuario\": \"[^\"]*\"/\"usuario\": \"$USER_PASSWORD\"/g" "$CONFIG_FILE"
            fi
        fi
    fi
    
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
else
    error "❌ Não foi possível conectar ao Docker"
fi

# Exibir informações do sistema
log "📊 Informações do sistema:"
log "   • Ambiente: ${NODE_ENV:-development}"
log "   • Porta: ${PORT:-3001}"
log "   • Diretório de dados: ${DATA_DIR:-/app/data}"
log "   • Diretório de scripts: ${SCRIPTS_DIR:-/app/scripts}"
log "   • Hostname: $(hostname)"
log "   • IP: $(hostname -i 2>/dev/null || echo 'N/A')"

# Executar servidor
log "🚀 Iniciando servidor Node.js..."
exec node server.js
