
#!/bin/bash

# Script unificado para build e deploy do TimeEventos
# Uso: ./build-deploy.sh

CONFIG_FILE=".build-config"

echo "=== TimeEventos Build & Deploy ==="

# Função para coletar todas as configurações
collect_config() {
    echo "=== Configuração do Build ==="
    
    echo "Selecione o ambiente:"
    echo "1) Desenvolvimento (local)"
    echo "2) Produção"
    read -p "Escolha (1 ou 2): " ENV_CHOICE
    
    if [ "$ENV_CHOICE" = "2" ]; then
        ENVIRONMENT="prod"
        read -p "Endereço da API (ex: http://servidor-producao:3001): " API_URL
    else
        ENVIRONMENT="dev"
        API_URL="http://timeeventos-backend:3001"
        echo "Usando API padrão para desenvolvimento: $API_URL"
    fi
    
    read -p "URL do Registry (ex: registry.uesb.br): " REGISTRY_URL
    read -p "Diretório no Registry (ex: timeeventos): " REGISTRY_DIR
    read -p "Nome do projeto [timeeventos]: " PROJECT_NAME
    PROJECT_NAME=${PROJECT_NAME:-timeeventos}
    
    read -p "Tag da imagem [latest]: " TAG
    TAG=${TAG:-latest}
    
    read -p "Username do Registry: " REGISTRY_USERNAME
    read -s -p "Password/Token do Registry: " REGISTRY_PASSWORD
    echo ""
    
    # Salvar configurações
    cat > $CONFIG_FILE << EOF
ENVIRONMENT=$ENVIRONMENT
API_URL=$API_URL
REGISTRY_URL=$REGISTRY_URL
REGISTRY_DIR=$REGISTRY_DIR
PROJECT_NAME=$PROJECT_NAME
TAG=$TAG
REGISTRY_USERNAME=$REGISTRY_USERNAME
REGISTRY_PASSWORD=$REGISTRY_PASSWORD
EOF
    
    echo "Configurações salvas em $CONFIG_FILE"
    echo "IMPORTANTE: Adicione '$CONFIG_FILE' ao seu .gitignore"
}

# Verificar se existe configuração
if [ ! -f "$CONFIG_FILE" ]; then
    collect_config
else
    echo "Carregando configurações existentes..."
    source $CONFIG_FILE
    
    echo "Configurações atuais:"
    echo "- Ambiente: $ENVIRONMENT"
    echo "- API URL: $API_URL"
    echo "- Registry: $REGISTRY_URL/$REGISTRY_DIR"
    echo "- Projeto: $PROJECT_NAME"
    echo "- Tag: $TAG"
    echo ""
    
    read -p "Deseja usar essas configurações? (y/n): " USE_EXISTING
    if [ "$USE_EXISTING" != "y" ]; then
        collect_config
        source $CONFIG_FILE
    fi
fi

# Criar arquivo de configuração da API para build
cat > .env.build << EOF
VITE_API_URL=$API_URL
EOF

echo "Arquivo de configuração da API criado: $API_URL"

# Fazer login no registry
echo "Fazendo login no registry..."
echo $REGISTRY_PASSWORD | docker login $REGISTRY_URL -u $REGISTRY_USERNAME --password-stdin

if [ $? -ne 0 ]; then
    echo "Erro: Falha no login do registry"
    exit 1
fi

# Definir nomes das imagens
FRONTEND_IMAGE="$REGISTRY_URL/$REGISTRY_DIR/$PROJECT_NAME-frontend:$TAG"
BACKEND_IMAGE="$REGISTRY_URL/$REGISTRY_DIR/$PROJECT_NAME-backend:$TAG"

echo "=== Building Images ==="
echo "Frontend: $FRONTEND_IMAGE"
echo "Backend: $BACKEND_IMAGE"

# Build das imagens
echo "Building frontend..."
docker build -t $FRONTEND_IMAGE .

echo "Building backend..."
docker build -t $BACKEND_IMAGE ./backend

# Push das imagens
echo "=== Pushing Images ==="
docker push $FRONTEND_IMAGE
docker push $BACKEND_IMAGE

echo "=== Build e Push Concluídos ==="
echo "Frontend: $FRONTEND_IMAGE"
echo "Backend: $BACKEND_IMAGE"

# Se for desenvolvimento, perguntar sobre deploy local
if [ "$ENVIRONMENT" = "dev" ]; then
    read -p "Deseja fazer deploy local? (y/n): " DEPLOY_LOCAL
    if [ "$DEPLOY_LOCAL" = "y" ]; then
        echo "=== Deploy Local ==="
        docker-compose up -d
        echo "Deploy local concluído!"
        echo "Frontend: http://localhost:8080"
        echo "Backend: http://localhost:3001"
    fi
else
    echo "=== Para deploy em produção ==="
    echo "Execute no servidor de produção:"
    echo "docker run -d -p 8080:8080 --name timeeventos-frontend $FRONTEND_IMAGE npm run preview -- --host 0.0.0.0 --port 8080"
    echo "docker run -d -p 3001:3001 --name timeeventos-backend -v /var/run/docker.sock:/var/run/docker.sock $BACKEND_IMAGE"
fi
