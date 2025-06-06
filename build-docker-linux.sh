
#!/bin/bash

echo "==========================================="
echo "    Script de Build Docker - Linux"
echo "==========================================="
echo

CONFIG_FILE="build-config.txt"
USE_SAVED="false"

# Verificar se existe arquivo de configuração salva
if [ -f "$CONFIG_FILE" ]; then
    echo "Configuração anterior encontrada!"
    echo -n "Deseja usar a configuração anterior? (s/n): "
    read USE_SAVED
fi

if [ "$USE_SAVED" = "s" ] || [ "$USE_SAVED" = "S" ]; then
    echo "Carregando configuração salva..."
    source "$CONFIG_FILE"
    echo "  Imagem: $IMAGE_NAME:$TAG"
    echo "  Domínio: $DOMAIN"
    echo "  Contexto: $BASE_PATH"
    echo
else
    # Solicitar informações do usuário
    echo -n "Digite o nome da imagem (registry/nomedaimagem): "
    read IMAGE_NAME
    if [ -z "$IMAGE_NAME" ]; then
        echo "Erro: Nome da imagem é obrigatório!"
        exit 1
    fi

    echo -n "Digite a tag (deixe vazio para 'latest'): "
    read TAG
    if [ -z "$TAG" ]; then
        TAG="latest"
    fi

    echo -n "Digite o domínio: "
    read DOMAIN
    if [ -z "$DOMAIN" ]; then
        echo "Erro: Domínio é obrigatório!"
        exit 1
    fi

    echo -n "Digite o caminho base da aplicação (ex: /scripts ou deixe vazio para /): "
    read BASE_PATH
    if [ -z "$BASE_PATH" ]; then
        BASE_PATH="/"
    fi

    # Normalizar BASE_PATH
    if [ "$BASE_PATH" != "/" ]; then
        # Garantir que comece com /
        if [[ ! "$BASE_PATH" =~ ^/ ]]; then
            BASE_PATH="/$BASE_PATH"
        fi
        # Garantir que não termine com /
        BASE_PATH=$(echo "$BASE_PATH" | sed 's/\/$//')
    fi

    # Salvar configuração para próxima vez
    cat > "$CONFIG_FILE" << EOF
IMAGE_NAME="$IMAGE_NAME"
TAG="$TAG"
DOMAIN="$DOMAIN"
BASE_PATH="$BASE_PATH"
EOF
    echo "Configuração salva em $CONFIG_FILE"
fi

echo
echo "==========================================="
echo "Configurações:"
echo "  Imagem: $IMAGE_NAME:$TAG"
echo "  Domínio: $DOMAIN"
echo "  Caminho: $BASE_PATH"
echo "==========================================="
echo

# Determinar URLs corretas baseadas no contexto
if [ "$BASE_PATH" = "/" ]; then
    API_URL="https://$DOMAIN/api"
    PUBLIC_URL="https://$DOMAIN"
else
    API_URL="https://$DOMAIN$BASE_PATH/api"
    PUBLIC_URL="https://$DOMAIN$BASE_PATH"
fi

# Criar arquivo .env.production
cat > .env.production << EOF
VITE_API_URL=$API_URL
VITE_BASE_PATH=$BASE_PATH
VITE_PUBLIC_URL=$PUBLIC_URL
NODE_ENV=production
DOMAIN=$DOMAIN
EOF

echo "Arquivo .env.production criado com sucesso!"
echo "  VITE_API_URL=$API_URL"
echo "  VITE_BASE_PATH=$BASE_PATH"
echo "  VITE_PUBLIC_URL=$PUBLIC_URL"
echo

# Build do Frontend com tratamento de erro
echo "==========================================="
echo "Building Frontend Image..."
echo "==========================================="
while true; do
    docker build -f Dockerfile.frontend.prod -t "$IMAGE_NAME-frontend:$TAG" .
    if [ $? -eq 0 ]; then
        break
    else
        echo "Erro no build do frontend!"
        echo -n "Deseja tentar novamente? (s/n): "
        read RETRY
        if [ "$RETRY" != "s" ] && [ "$RETRY" != "S" ]; then
            exit 1
        fi
    fi
done

echo "Frontend build concluído!"
echo

# Build do Backend com tratamento de erro
echo "==========================================="
echo "Building Backend Image..."
echo "==========================================="
while true; do
    docker build -f backend/Dockerfile.prod -t "$IMAGE_NAME-backend:$TAG" ./backend
    if [ $? -eq 0 ]; then
        break
    else
        echo "Erro no build do backend!"
        echo -n "Deseja tentar novamente? (s/n): "
        read RETRY
        if [ "$RETRY" != "s" ] && [ "$RETRY" != "S" ]; then
            exit 1
        fi
    fi
done

echo "Backend build concluído!"
echo

# Perguntar sobre push
echo "==========================================="
echo -n "Deseja enviar (push) as imagens para o registry agora? (s/n): "
read PUSH_CHOICE
if [ "$PUSH_CHOICE" = "s" ] || [ "$PUSH_CHOICE" = "S" ]; then
    echo
    echo "Enviando imagens para o registry..."
    docker push "$IMAGE_NAME-frontend:$TAG"
    docker push "$IMAGE_NAME-backend:$TAG"
    echo
    echo "Push concluído!"
else
    echo
    echo "Build concluído sem push."
fi

echo
echo "==========================================="
echo "INSTRUÇÕES DE DEPLOY:"
echo "==========================================="
echo "1. Após o push, use as imagens:"
echo "   Frontend: $IMAGE_NAME-frontend:$TAG"
echo "   Backend: $IMAGE_NAME-backend:$TAG"
echo
echo "2. Configure o nginx para:"
echo "   Domínio: $DOMAIN"
echo "   Contexto: $BASE_PATH"
echo
echo "3. As aplicações estão configuradas para:"
echo "   Frontend: $PUBLIC_URL"
echo "   API: $API_URL"
echo "==========================================="
echo "Script finalizado!"
echo "==========================================="
