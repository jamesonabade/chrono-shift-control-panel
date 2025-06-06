
# Guia de Construção de Imagens Docker

Este documento explica como construir e preparar imagens Docker para deploy em produção.

## 🏗️ Construindo as Imagens

### Imagem do Frontend

```bash
# Na raiz do projeto
docker build -f Dockerfile.frontend.prod -t registry.uesb.br/sig-testes/timeeventos-frontend:latest .

# Para fazer push para registry
docker push registry.uesb.br/sig-testes/timeeventos-frontend:latest
```

### Imagem do Backend

```bash
# Na raiz do projeto (o contexto deve ser ./backend)
docker build -f backend/Dockerfile.prod -t registry.uesb.br/sig-testes/timeeventos-backend:latest ./backend

# Para fazer push para registry
docker push registry.uesb.br/sig-testes/timeeventos-backend:latest
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
   FRONTEND_IMAGE=registry.uesb.br/sig-testes/timeeventos-frontend:latest
   BACKEND_IMAGE=registry.uesb.br/sig-testes/timeeventos-backend:latest
   ```
3. No `docker-compose.prod.yml`, comente as seções `build:` e descomente as linhas `image:`

## 📋 Preparação para Produção

### 1. Teste Local

Teste as imagens localmente antes do deploy:

```bash
# Teste do frontend
docker run -p 8080:8080 registry.uesb.br/sig-testes/timeeventos-frontend:latest

# Teste do backend (precisará de variáveis de ambiente)
docker run -p 3001:3001 \
  -e NODE_ENV=production \
  -e DOMAIN=localhost \
  registry.uesb.br/sig-testes/timeeventos-backend:latest
```

### 2. Configuração de Versões

Para controle de versões:
```env
FRONTEND_IMAGE=registry.uesb.br/sig-testes/timeeventos-frontend:v1.0.0
BACKEND_IMAGE=registry.uesb.br/sig-testes/timeeventos-backend:v1.0.0
```

### 3. Multi-arch (ARM64 + AMD64)

Para suporte a diferentes arquiteturas:
```bash
# Criar builder multi-arch
docker buildx create --name multiarch --use

# Build multi-arch do frontend
docker buildx build --platform linux/amd64,linux/arm64 \
  -f Dockerfile.frontend.prod \
  -t registry.uesb.br/sig-testes/timeeventos-frontend:latest \
  --push .

# Build multi-arch do backend
docker buildx build --platform linux/amd64,linux/arm64 \
  -f backend/Dockerfile.prod \
  -t registry.uesb.br/sig-testes/timeeventos-backend:latest \
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
        registry: registry.uesb.br
        username: ${{ secrets.REGISTRY_USERNAME }}
        password: ${{ secrets.REGISTRY_PASSWORD }}
    
    - name: Build and push Frontend
      uses: docker/build-push-action@v4
      with:
        context: .
        file: ./Dockerfile.frontend.prod
        push: true
        tags: registry.uesb.br/sig-testes/timeeventos-frontend:latest
        platforms: linux/amd64,linux/arm64
    
    - name: Build and push Backend
      uses: docker/build-push-action@v4
      with:
        context: ./backend
        file: ./backend/Dockerfile.prod
        push: true
        tags: registry.uesb.br/sig-testes/timeeventos-backend:latest
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

## 🛠️ Comandos Corretos

### Frontend
```bash
# Na raiz do projeto
docker build -f Dockerfile.frontend.prod -t registry.uesb.br/sig-testes/timeeventos-frontend:latest .
```

### Backend
```bash
# Na raiz do projeto (contexto correto para o backend)
docker build -f backend/Dockerfile.prod -t registry.uesb.br/sig-testes/timeeventos-backend:latest ./backend
```

**Importante:** 
- O arquivo `nginx-frontend.conf` deve estar na raiz do projeto
- O arquivo `backend/init-prod.sh` deve estar na pasta backend
- O contexto do build do backend é `./backend`, não `.`
