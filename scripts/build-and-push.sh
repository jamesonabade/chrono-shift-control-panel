
#!/bin/bash

# Script para build e push das imagens para registry privado

# Configurações
REGISTRY_URL=${REGISTRY_URL:-"your-private-registry.com"}
TAG=${TAG:-$(date +%Y%m%d-%H%M%S)}

echo "=== Building and pushing images to $REGISTRY_URL ==="

# Build frontend
echo "Building frontend image..."
docker build -f Dockerfile.prod -t $REGISTRY_URL/chrono-frontend:$TAG .
docker build -f Dockerfile.prod -t $REGISTRY_URL/chrono-frontend:latest .

# Build backend
echo "Building backend image..."
docker build -f backend/Dockerfile.prod -t $REGISTRY_URL/chrono-backend:$TAG ./backend
docker build -f backend/Dockerfile.prod -t $REGISTRY_URL/chrono-backend:latest ./backend

# Push images
echo "Pushing images..."
docker push $REGISTRY_URL/chrono-frontend:$TAG
docker push $REGISTRY_URL/chrono-frontend:latest
docker push $REGISTRY_URL/chrono-backend:$TAG
docker push $REGISTRY_URL/chrono-backend:latest

echo "=== Images pushed successfully ==="
echo "Frontend: $REGISTRY_URL/chrono-frontend:$TAG"
echo "Backend: $REGISTRY_URL/chrono-backend:$TAG"
