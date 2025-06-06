
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

### Opção 1: Imagens Pré-construídas (Recomendado para Produção)

**Vantagens:**
- Deploy mais rápido (não precisa compilar)
- Controle total sobre as versões
- Ideal para ambientes críticos
- Entrypoints configurados adequadamente

**Configuração:**
1. Construa e publique as imagens (comandos acima)
2. Configure no `.env`:
   ```env
   FRONTEND_IMAGE=registry.uesb.br/sig-testes/timeeventos-frontend:latest
   BACKEND_IMAGE=registry.uesb.br/sig-testes/timeeventos-backend:latest
   ```
3. No `docker-compose.prod.yml`, use as linhas `image:` (já configurado)

### Opção 2: Build Automático

**Vantagens:**
- Sempre usa a versão mais recente do código
- Não precisa construir imagens manualmente
- Portainer faz tudo automaticamente

**Configuração:**
1. **Suba seu código** para GitHub
2. **Configure as variáveis**:
   ```env
   GITHUB_USER=seu-usuario
   GITHUB_REPO=seu-repositorio
   ```
3. Descomente as seções `build:` no `docker-compose.prod.yml`

## 🔧 Recursos dos Entrypoints

### Frontend
- ✅ Aguarda backend ficar disponível
- ✅ Configura nginx adequadamente
- ✅ Logs detalhados de inicialização
- ✅ Health check endpoint
- ✅ Verificação de variáveis de ambiente

### Backend
- ✅ Aguarda PostgreSQL estar disponível
- ✅ Testa conexão com banco de dados
- ✅ Configura sistema na primeira execução
- ✅ Verifica conectividade com Docker
- ✅ Logs coloridos e informativos
- ✅ Health check endpoint

## 📋 Preparação para Produção

### 1. Teste Local

Teste as imagens localmente antes do deploy:

```bash
# Teste do frontend
docker run -p 8080:8080 \
  -e VITE_API_URL=/api \
  -e VITE_BASE_PATH=/ \
  registry.uesb.br/sig-testes/timeeventos-frontend:latest

# Teste do backend (precisará de PostgreSQL)
docker run -p 3001:3001 \
  -e NODE_ENV=production \
  -e DOMAIN=localhost \
  -e DB_HOST=localhost \
  -e DB_NAME=sistema_db \
  -e DB_USER=sistema_user \
  -e DB_PASSWORD=sua-senha \
  registry.uesb.br/sig-testes/timeeventos-backend:latest
```

### 2. Estrutura de Arquivos

Para que o build funcione corretamente, certifique-se de que a estrutura está assim:

```
projeto/
├── Dockerfile.frontend.prod          # Dockerfile do frontend
├── frontend-entrypoint.sh            # Script de entrypoint do frontend
├── nginx-frontend.conf               # Configuração do nginx
├── backend/
│   ├── Dockerfile.prod              # Dockerfile do backend
│   ├── init-prod.sh                 # Script de inicialização do backend
│   ├── package.json
│   └── ... (outros arquivos backend)
├── src/
├── package.json
└── ... (outros arquivos frontend)
```

## 🔍 Monitoramento e Logs

### Verificar Status dos Containers

```bash
# Status de todos os containers
docker ps | grep sistema

# Logs do frontend
docker logs -f sistema-producao_frontend_1

# Logs do backend
docker logs -f sistema-producao_backend_1

# Logs do banco de dados
docker logs -f sistema-producao_database_1
```

### O que esperar nos logs:

**Frontend:**
```
🚀 Iniciando configuração do frontend...
🔧 Configurando variáveis de ambiente...
🔍 Aguardando backend ficar disponível...
✅ Backend está disponível
🌐 Configurando nginx...
🚀 Iniciando nginx...
Frontend pronto para uso!
```

**Backend:**
```
🚀 Iniciando configuração do sistema de produção...
🔧 Configurando variáveis de ambiente...
🗄️ Aguardando banco de dados PostgreSQL...
✅ Banco de dados PostgreSQL está disponível
✅ Conexão com banco de dados estabelecida com sucesso
🎯 Primeira execução detectada - configurando sistema...
✅ Configuração inicial concluída!
🚀 Iniciando servidor Node.js...
Sistema backend pronto para uso!
```

## 🔧 Troubleshooting

### Container não inicia ou fica em "Starting"

**Possíveis causas:**
1. Banco de dados não está disponível
2. Variáveis de ambiente incorretas
3. Problemas de conectividade entre containers

**Verificações:**
```bash
# Verificar logs detalhados
docker logs sistema-producao_backend_1

# Verificar conectividade com banco
docker exec sistema-producao_backend_1 pg_isready -h database -U sistema_user

# Verificar variáveis de ambiente
docker exec sistema-producao_backend_1 env | grep -E "DB_|DOMAIN|BASE_PATH"
```

### Backend não consegue conectar no banco

**Solução:**
1. Verificar se o container do banco está rodando
2. Verificar se as credenciais estão corretas
3. Aguardar mais tempo (banco pode demorar para inicializar)

### Frontend não consegue acessar backend

**Solução:**
1. Verificar se `VITE_API_URL` está configurado corretamente
2. Verificar se o backend está respondendo no health check
3. Verificar configuração de proxy no nginx

### Erro: "pg_isready: not found"

**Causa:** PostgreSQL client não está instalado no container

**Solução:** As imagens já foram corrigidas para incluir `postgresql-client`

## ✅ Checklist de Build

- [ ] Arquivo `frontend-entrypoint.sh` existe na raiz
- [ ] Arquivo `nginx-frontend.conf` existe na raiz
- [ ] Arquivo `backend/init-prod.sh` existe e tem permissões de execução
- [ ] Comando de build do frontend usa contexto `.` (raiz)
- [ ] Comando de build do backend usa contexto `.` (raiz) 
- [ ] Imagens construídas e testadas
- [ ] Registry configurado (se aplicável)
- [ ] Push realizado com sucesso
- [ ] Entrypoints testados e funcionando
- [ ] Logs de inicialização aparecem corretamente

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

## 🔄 Atualizações

Para atualizar o sistema:

1. **Reconstrua** as imagens com as alterações
2. **Faça push** das novas versões
3. **No Portainer** → Stacks → seu-stack → "Redeploy"
4. **Monitore** os logs para garantir inicialização correta

Os entrypoints garantem que cada container seja configurado adequadamente antes de inicializar, proporcionando maior confiabilidade no deploy.
