
#!/bin/bash

# Script para build e deploy do TimeEventos
# Uso: ./build-deploy.sh [dev|prod]

ENVIRONMENT=${1:-dev}
CONFIG_FILE=".registry-config"

echo "=== TimeEventos Build & Deploy ==="
echo "Ambiente: $ENVIRONMENT"

# Função para coletar configurações do registry
collect_registry_config() {
    echo "=== Configuração do Registry Privado ==="
    read -p "URL do Registry (ex: my-registry.com): " REGISTRY_URL
    read -p "Username do Registry: " REGISTRY_USERNAME
    read -s -p "Password/Token do Registry: " REGISTRY_PASSWORD
    echo ""
    
    # Salvar configurações
    cat > $CONFIG_FILE << EOF
REGISTRY_URL=$REGISTRY_URL
REGISTRY_USERNAME=$REGISTRY_USERNAME
REGISTRY_PASSWORD=$REGISTRY_PASSWORD
EOF
    
    echo "Configurações salvas em $CONFIG_FILE"
    echo "IMPORTANTE: Adicione '$CONFIG_FILE' ao seu .gitignore"
}

# Verificar se existe configuração
if [ ! -f "$CONFIG_FILE" ]; then
    collect_registry_config
else
    echo "Carregando configurações existentes..."
    source $CONFIG_FILE
fi

# Validar variáveis
if [ -z "$REGISTRY_URL" ] || [ -z "$REGISTRY_USERNAME" ]; then
    echo "Erro: Configurações do registry não encontradas"
    exit 1
fi

# Fazer login no registry
echo "Fazendo login no registry..."
echo $REGISTRY_PASSWORD | docker login $REGISTRY_URL -u $REGISTRY_USERNAME --password-stdin

if [ $? -ne 0 ]; then
    echo "Erro: Falha no login do registry"
    exit 1
fi

# Gerar tag baseada no ambiente
if [ "$ENVIRONMENT" = "prod" ]; then
    TAG=$(date +%Y%m%d-%H%M%S)
    COMPOSE_FILE="docker-compose.prod.yml"
else
    TAG="dev-$(date +%Y%m%d-%H%M%S)"
    COMPOSE_FILE="docker-compose.yml"
fi

echo "Tag: $TAG"
echo "Compose file: $COMPOSE_FILE"

# Build das imagens
echo "=== Building Frontend ==="
docker build -f Dockerfile.prod -t $REGISTRY_URL/timeeventos-frontend:$TAG .
docker build -f Dockerfile.prod -t $REGISTRY_URL/timeeventos-frontend:latest .

echo "=== Building Backend ==="
docker build -f backend/Dockerfile.prod -t $REGISTRY_URL/timeeventos-backend:$TAG ./backend
docker build -f backend/Dockerfile.prod -t $REGISTRY_URL/timeeventos-backend:latest ./backend

# Push das imagens
echo "=== Pushing Images ==="
docker push $REGISTRY_URL/timeeventos-frontend:$TAG
docker push $REGISTRY_URL/timeeventos-frontend:latest
docker push $REGISTRY_URL/timeeventos-backend:$TAG
docker push $REGISTRY_URL/timeeventos-backend:latest

echo "=== Build e Push Concluídos ==="
echo "Frontend: $REGISTRY_URL/timeeventos-frontend:$TAG"
echo "Backend: $REGISTRY_URL/timeeventos-backend:$TAG"

# Se for ambiente de desenvolvimento, fazer deploy local
if [ "$ENVIRONMENT" = "dev" ]; then
    echo "=== Deploy Local (Desenvolvimento) ==="
    REGISTRY_URL=$REGISTRY_URL TAG=$TAG docker-compose -f $COMPOSE_FILE up -d
    echo "Deploy local concluído!"
else
    echo "=== Para deploy em produção ==="
    echo "Execute no servidor de produção:"
    echo "REGISTRY_URL=$REGISTRY_URL TAG=$TAG docker-compose -f $COMPOSE_FILE up -d"
fi
