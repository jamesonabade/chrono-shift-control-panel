
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
    read -p "Deseja usar a configuração anterior? (s/n): " USE_SAVED
fi

if [ "$USE_SAVED" = "s" ] || [ "$USE_SAVED" = "S" ]; then
    echo "Carregando configuração salva..."
    source $CONFIG_FILE
    echo "  Imagem: $IMAGE_NAME:$TAG"
    echo "  Domínio: $DOMAIN"
    echo
else
    # Solicitar informações do usuário
    read -p "Digite o nome da imagem (registry/nomedaimagem): " IMAGE_NAME
    if [ -z "$IMAGE_NAME" ]; then
        echo "Erro: Nome da imagem é obrigatório!"
        exit 1
    fi

    read -p "Digite a tag (deixe vazio para 'latest'): " TAG
    if [ -z "$TAG" ]; then
        TAG="latest"
    fi

    read -p "Digite o domínio: " DOMAIN
    if [ -z "$DOMAIN" ]; then
        echo "Erro: Domínio é obrigatório!"
        exit 1
    fi

    # Salvar configuração para próxima vez
    cat > $CONFIG_FILE << EOF
IMAGE_NAME="$IMAGE_NAME"
TAG="$TAG"
DOMAIN="$DOMAIN"
EOF
    echo "Configuração salva em $CONFIG_FILE"
fi

echo
echo "==========================================="
echo "Configurações:"
echo "  Imagem: $IMAGE_NAME:$TAG"
echo "  Domínio: $DOMAIN"
echo "==========================================="
echo

# Criar arquivo .env.production
cat > .env.production << EOF
VITE_API_URL=https://$DOMAIN/api
NODE_ENV=production
DOMAIN=$DOMAIN
EOF

echo "Arquivo .env.production criado com sucesso!"
echo

# Build do Frontend com tratamento de erro
echo "==========================================="
echo "Building Frontend Image..."
echo "==========================================="
while true; do
    docker build -f Dockerfile.frontend.prod -t $IMAGE_NAME-frontend:$TAG .
    if [ $? -eq 0 ]; then
        break
    else
        echo "Erro no build do frontend!"
        read -p "Deseja tentar novamente? (s/n): " RETRY
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
    docker build -f backend/Dockerfile.prod -t $IMAGE_NAME-backend:$TAG ./backend
    if [ $? -eq 0 ]; then
        break
    else
        echo "Erro no build do backend!"
        read -p "Deseja tentar novamente? (s/n): " RETRY
        if [ "$RETRY" != "s" ] && [ "$RETRY" != "S" ]; then
            exit 1
        fi
    fi
done

echo "Backend build concluído!"
echo

# Perguntar sobre push
echo "==========================================="
read -p "Deseja enviar (push) as imagens para o registry agora? (s/n): " PUSH_CHOICE
if [ "$PUSH_CHOICE" = "s" ] || [ "$PUSH_CHOICE" = "S" ]; then
    echo
    echo "Enviando imagens para o registry..."
    docker push $IMAGE_NAME-frontend:$TAG
    docker push $IMAGE_NAME-backend:$TAG
    echo
    echo "Push concluído!"
else
    echo
    echo "Build concluído sem push."
fi

echo
echo "==========================================="
echo "Script finalizado!"
echo "==========================================="
