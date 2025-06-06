
# Guia de Construção de Imagens Docker

Este documento explica como construir e preparar imagens Docker para deploy em produção.

## 🏗️ Construindo as Imagens

### Comando Correto para Frontend

```bash
# Na raiz do projeto
docker build -f Dockerfile.frontend.prod -t registry.uesb.br/sig-testes/timeeventos-frontend:latest .
```

### Comando Correto para Backend

```bash
# Na raiz do projeto (importante: contexto deve ser a raiz)
docker build -f backend/Dockerfile.prod -t registry.uesb.br/sig-testes/timeeventos-backend:latest .
```

**IMPORTANTE:** Note que o contexto do build do backend é `.` (raiz do projeto), não `./backend`. Isso é necessário porque o Dockerfile precisa acessar tanto os arquivos da pasta `backend/` quanto o arquivo `backend/init-prod.sh`.

### Para fazer push para registry

```bash
# Push do frontend
docker push registry.uesb.br/sig-testes/timeeventos-frontend:latest

# Push do backend  
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

### 2. Estrutura de Arquivos

Para que o build funcione corretamente, certifique-se de que a estrutura está assim:

```
projeto/
├── Dockerfile.frontend.prod          # Dockerfile do frontend
├── nginx-frontend.conf               # Configuração do nginx
├── backend/
│   ├── Dockerfile.prod              # Dockerfile do backend
│   ├── init-prod.sh                 # Script de inicialização
│   ├── package.json
│   └── ... (outros arquivos backend)
├── src/
├── package.json
└── ... (outros arquivos frontend)
```

## 🔧 Troubleshooting

### Erro: "init-prod.sh: not found"

**Causa:** O contexto do build está incorreto ou o arquivo não existe.

**Solução:** 
1. Certifique-se que o arquivo `backend/init-prod.sh` existe
2. Execute o build do backend a partir da raiz do projeto:
   ```bash
   docker build -f backend/Dockerfile.prod -t registry.uesb.br/sig-testes/timeeventos-backend:latest .
   ```

### Erro: "nginx-frontend.conf: not found"

**Causa:** O arquivo de configuração do nginx não está na raiz.

**Solução:**
1. Certifique-se que o arquivo `nginx-frontend.conf` está na raiz do projeto
2. Execute o build do frontend a partir da raiz:
   ```bash
   docker build -f Dockerfile.frontend.prod -t registry.uesb.br/sig-testes/timeeventos-frontend:latest .
   ```

### Erro: "vite: not found"

**Causa:** As dependências de desenvolvimento não foram instaladas.

**Solução:** O Dockerfile já foi corrigido para usar `npm ci` que instala todas as dependências necessárias.

## ✅ Checklist de Build

- [ ] Arquivo `nginx-frontend.conf` existe na raiz
- [ ] Arquivo `backend/init-prod.sh` existe e tem permissões de execução
- [ ] Comando de build do frontend usa contexto `.` (raiz)
- [ ] Comando de build do backend usa contexto `.` (raiz) 
- [ ] Imagens construídas e testadas
- [ ] Registry configurado (se aplicável)
- [ ] Push realizado com sucesso

## 🎯 Comandos Finais Corretos

```bash
# Frontend
docker build -f Dockerfile.frontend.prod -t registry.uesb.br/sig-testes/timeeventos-frontend:latest .

# Backend  
docker build -f backend/Dockerfile.prod -t registry.uesb.br/sig-testes/timeeventos-backend:latest .

# Push
docker push registry.uesb.br/sig-testes/timeeventos-frontend:latest
docker push registry.uesb.br/sig-testes/timeeventos-backend:latest
```
