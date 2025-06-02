
#!/bin/bash

# Script de deploy para produção

# Variáveis de ambiente necessárias
REGISTRY_URL=${REGISTRY_URL:-"your-private-registry.com"}
TAG=${TAG:-"latest"}
SERVER_HOST=${SERVER_HOST:-"localhost"}

echo "=== Deploy para produção ==="
echo "Registry: $REGISTRY_URL"
echo "Tag: $TAG"
echo "Server: $SERVER_HOST"

# Criar arquivo de configuração personalizado
cat > config/config.js << EOF
// Configuração para produção - $SERVER_HOST
window.APP_CONFIG = {
  API_URL: 'http://$SERVER_HOST:3001'
};
EOF

echo "Configuração criada para servidor: $SERVER_HOST"

# Executar docker-compose
REGISTRY_URL=$REGISTRY_URL TAG=$TAG docker-compose -f docker-compose.prod.yml up -d

echo "=== Deploy concluído ==="
