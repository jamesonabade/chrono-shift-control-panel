
# Guia de Construção de Imagens Docker

Este documento explica como construir e preparar imagens Docker para deploy em produção.

## 🏗️ Construindo as Imagens

### Imagem do Frontend

```bash
# Na raiz do projeto
docker build -f Dockerfile.frontend.prod -t meu-registry/sistema-frontend:latest .

# Para fazer push para registry
docker push meu-registry/sistema-frontend:latest
```

### Imagem do Backend

```bash
# Na raiz do projeto (não na pasta backend/)
docker build -f backend/Dockerfile.prod -t meu-registry/sistema-backend:latest ./backend

# Para fazer push para registry
docker push meu-registry/sistema-backend:latest
```

## 🚀 Opções de Deploy no Portainer

### Opção 1: Build Automático (Recomendado)

**Vantagens:**
- Sempre usa a versão mais recente do código
- Não precisa construir imagens manualmente
- Portainer faz tudo automaticamente

**Configuração:**
1. Suba seu código para GitHub
2. Configure no `.env`:
   ```env
   GITHUB_USER=seu-usuario
   GITHUB_REPO=seu-repositorio
   ```
3. Use o `docker-compose.prod.yml` como está

### Opção 2: Imagens Pré-construídas

**Vantagens:**
- Deploy mais rápido (não precisa compilar)
- Controle total sobre as versões
- Ideal para ambientes críticos

**Configuração:**
1. Construa e publique as imagens (comandos acima)
2. Configure no `.env`:
   ```env
   FRONTEND_IMAGE=meu-registry/sistema-frontend:latest
   BACKEND_IMAGE=meu-registry/sistema-backend:latest
   ```
3. No `docker-compose.prod.yml`, comente as seções `build:` e descomente as linhas `image:`

## 📋 Preparação para Produção

### 1. Configuração do Registry

Se usar registry privado:
```bash
# Login no registry
docker login meu-registry.com

# Tag das imagens
docker tag sistema-frontend meu-registry.com/sistema-frontend:v1.0.0
docker tag sistema-backend meu-registry.com/sistema-backend:v1.0.0

# Push das imagens
docker push meu-registry.com/sistema-frontend:v1.0.0
docker push meu-registry.com/sistema-backend:v1.0.0
```

### 2. Configuração de Versões

Para controle de versões:
```env
FRONTEND_IMAGE=meu-registry/sistema-frontend:v1.0.0
BACKEND_IMAGE=meu-registry/sistema-backend:v1.0.0
```

### 3. Multi-arch (ARM64 + AMD64)

Para suporte a diferentes arquiteturas:
```bash
# Criar builder multi-arch
docker buildx create --name multiarch --use

# Build multi-arch do frontend
docker buildx build --platform linux/amd64,linux/arm64 \
  -f Dockerfile.frontend.prod \
  -t meu-registry/sistema-frontend:latest \
  --push .

# Build multi-arch do backend
docker buildx build --platform linux/amd64,linux/arm64 \
  -f backend/Dockerfile.prod \
  -t meu-registry/sistema-backend:latest \
  --push ./backend
```

## 🔄 Automação com GitHub Actions

Exemplo de workflow para build automático:

```yaml
# .github/workflows/build.yml
name: Build and Push Images

on:
  push:
    branches: [ main ]
  release:
    types: [ published ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to Registry
      uses: docker/login-action@v2
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Build and push Frontend
      uses: docker/build-push-action@v4
      with:
        context: .
        file: ./Dockerfile.frontend.prod
        push: true
        tags: ghcr.io/${{ github.repository }}/frontend:latest
        platforms: linux/amd64,linux/arm64
    
    - name: Build and push Backend
      uses: docker/build-push-action@v4
      with:
        context: ./backend
        file: ./backend/Dockerfile.prod
        push: true
        tags: ghcr.io/${{ github.repository }}/backend:latest
        platforms: linux/amd64,linux/arm64
```

## 🎯 Qual Método Escolher?

### Use Build Automático se:
- Quer simplicidade máxima
- Sempre quer a versão mais recente
- Não se importa com tempo de build inicial
- Está testando ou em desenvolvimento

### Use Imagens Pré-construídas se:
- Quer controle total sobre versões
- Deploy precisa ser muito rápido
- Ambiente de produção crítico
- Quer fazer rollback fácil entre versões
- Tem pipeline de CI/CD configurado

## ✅ Checklist de Deploy

- [ ] Imagens construídas e testadas
- [ ] Registry configurado (se aplicável)
- [ ] Variáveis de ambiente definidas
- [ ] Senhas alteradas para produção
- [ ] Banco de dados configurado
- [ ] Volumes de backup planejados
- [ ] Monitoramento configurado
- [ ] SSL/HTTPS configurado (se necessário)

## 🛠️ Comandos Corrigidos

### Frontend
```bash
# Na raiz do projeto
docker build -f Dockerfile.frontend.prod -t meu-registry/sistema-frontend:latest .
```

### Backend
```bash
# Na raiz do projeto (contexto correto)
docker build -f backend/Dockerfile.prod -t meu-registry/sistema-backend:latest ./backend
```

**Importante:** Note que o comando do backend usa `./backend` como contexto, não apenas `.` - isso garante que todos os arquivos necessários estejam disponíveis durante o build.
