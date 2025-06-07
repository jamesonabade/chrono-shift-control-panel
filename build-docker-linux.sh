
#!/bin/bash

echo "==========================================="
echo "    Script de Build Docker - Linux"
echo "==========================================="
echo

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

# Build do Frontend
echo "==========================================="
echo "Building Frontend Image..."
echo "==========================================="
docker build -f Dockerfile.frontend.prod -t $IMAGE_NAME-frontend:$TAG .
if [ $? -ne 0 ]; then
    echo "Erro no build do frontend!"
    exit 1
fi

echo "Frontend build concluído!"
echo

# Build do Backend
echo "==========================================="
echo "Building Backend Image..."
echo "==========================================="
docker build -f backend/Dockerfile.prod -t $IMAGE_NAME-backend:$TAG ./backend
if [ $? -ne 0 ]; then
    echo "Erro no build do backend!"
    exit 1
fi

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
