
#!/bin/bash

# Script para build e push das imagens TimeEventos para registry privado

# Configurações
REGISTRY_URL=${REGISTRY_URL:-"your-private-registry.com"}
TAG=${TAG:-$(date +%Y%m%d-%H%M%S)}

echo "=== Building and pushing TimeEventos images to $REGISTRY_URL ==="

# Build frontend
echo "Building timeeventos-frontend image..."
docker build -f Dockerfile.prod -t $REGISTRY_URL/timeeventos-frontend:$TAG .
docker build -f Dockerfile.prod -t $REGISTRY_URL/timeeventos-frontend:latest .

# Build backend
echo "Building timeeventos-backend image..."
docker build -f backend/Dockerfile.prod -t $REGISTRY_URL/timeeventos-backend:$TAG ./backend
docker build -f backend/Dockerfile.prod -t $REGISTRY_URL/timeeventos-backend:latest ./backend

# Push images
echo "Pushing images..."
docker push $REGISTRY_URL/timeeventos-frontend:$TAG
docker push $REGISTRY_URL/timeeventos-frontend:latest
docker push $REGISTRY_URL/timeeventos-backend:$TAG
docker push $REGISTRY_URL/timeeventos-backend:latest

echo "=== TimeEventos images pushed successfully ==="
echo "Frontend: $REGISTRY_URL/timeeventos-frontend:$TAG"
echo "Backend: $REGISTRY_URL/timeeventos-backend:$TAG"
