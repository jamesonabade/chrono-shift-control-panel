
# Guia de Construção de Imagens Docker

Este documento explica como construir e preparar imagens Docker para deploy em produção.

## 🏗️ Construindo as Imagens

### Comando Correto para Frontend

```bash
# Na raiz do projeto
docker build --no-cache -f Dockerfile.frontend.prod -t registry.uesb.br/sig-testes/timeeventos-frontend:latest .
```

### Comando Correto para Backend

```bash
# Na raiz do projeto (importante: contexto deve ser a raiz)
docker build --no-cache -f backend/Dockerfile.prod -t registry.uesb.br/sig-testes/timeeventos-backend:latest .
```

**IMPORTANTE:** Note que o contexto do build do backend é `.` (raiz do projeto), não `./backend`. Isso é necessário porque o Dockerfile precisa acessar tanto os arquivos da pasta `backend/` quanto o arquivo `backend/init-prod.sh`.

### Para fazer push para registry

```bash
# Push do frontend
docker push registry.uesb.br/sig-testes/timeeventos-frontend:latest

# Push do backend  
docker push registry.uesb.br/sig-testes/timeeventos-backend:latest
```

## 🚨 Problemas Comuns e Soluções

### Erro: "exec format error"

**Causa:** Arquivo de script com terminações de linha Windows (CRLF) em vez de Unix (LF)

**Soluções automáticas nos Dockerfiles:**
- Os Dockerfiles agora incluem `dos2unix` para conversão automática
- Scripts são convertidos durante o build com `dos2unix`
- Entrypoints usam `/bin/bash` explicitamente

**Soluções manuais se necessário:**
1. **Git configuração (recomendado):**
   ```bash
   git config core.autocrlf false
   git rm --cached -r .
   git reset --hard
   ```

2. **Conversão manual:**
   ```bash
   # Linux/macOS
   dos2unix frontend-entrypoint.sh
   dos2unix backend/init-prod.sh
   
   # Windows (Git Bash)
   sed -i 's/\r$//' frontend-entrypoint.sh
   sed -i 's/\r$//' backend/init-prod.sh
   ```

### Erro: "Syntax error: word unexpected"

**Causa:** Caracteres invisíveis ou quebras de linha incorretas nos scripts bash

**Solução:** Os Dockerfiles agora incluem:
- `dos2unix` para corrigir automaticamente
- `set -e` nos scripts para parar em erros
- `/bin/bash` explícito como interpretador

### Erro: "not found" em scripts

**Causa:** Problemas de encoding ou caracteres especiais

**Verificação:**
```bash
# Verificar encoding do arquivo
file frontend-entrypoint.sh
file backend/init-prod.sh

# Deve mostrar: "ASCII text" ou "UTF-8 Unicode text"
```

## 🏗️ Mudanças nas Imagens Base

### Atualizações Implementadas

- **Frontend:** Migrado de `nginx:alpine` para `nginx:bookworm`
- **Backend:** Migrado de `node:20-bookworm` para `node:20-bookworm` (já estava correto)
- **Desenvolvimento:** Migrado de `node:18-bookworm` para `node:20-bookworm`
- **Docker CLI:** Migrado de `docker:25` para `docker:25-cli`

### Benefícios da Migração

- **Compatibilidade:** Melhor suporte a scripts bash
- **Ferramentas:** `dos2unix` disponível nativamente
- **Estabilidade:** Debian é mais estável que Alpine para scripts complexos
- **Debug:** Melhor suporte a debugging e logging

## 🚀 Opções de Deploy no Portainer

### Opção 1: Imagens Pré-construídas (Recomendado para Produção)

**Vantagens:**
- Deploy mais rápido (não precisa compilar)
- Controle total sobre as versões
- Ideal para ambientes críticos
- Entrypoints configurados adequadamente
- Scripts corrigidos para Debian Bookworm

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
- ✅ Conversão automática de quebras de linha
- ✅ Uso explícito de `/bin/bash`
- ✅ Script com `set -e` para tratamento de erros

### Backend
- ✅ Aguarda PostgreSQL estar disponível
- ✅ Testa conexão com banco de dados
- ✅ Configura sistema na primeira execução
- ✅ Verifica conectividade com Docker
- ✅ Logs coloridos e informativos
- ✅ Health check endpoint
- ✅ Conversão automática de quebras de linha
- ✅ Uso explícito de `/bin/bash`
- ✅ Script com `set -e` para tratamento de erros

## 📋 Preparação para Produção

### 1. Configurar Git Corretamente

```bash
# Configurar para não converter quebras de linha
git config core.autocrlf false

# Verificar configuração
git config --list | grep autocrlf

# Limpar cache e resetar arquivos
git rm --cached -r .
git reset --hard
```

### 2. Verificar Arquivos de Script

```bash
# Verificar formato dos scripts
file frontend-entrypoint.sh
file backend/init-prod.sh

# Corrigir se necessário (os Dockerfiles fazem isso automaticamente)
dos2unix frontend-entrypoint.sh backend/init-prod.sh
```

### 3. Teste Local

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

## 🔍 Monitoramento e Logs

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

### Scripts não executam ou têm erros de sintaxe

**Solução rápida:**
```bash
# Re-construir imagens após corrigir scripts (com --no-cache obrigatório)
docker build --no-cache -f Dockerfile.frontend.prod -t registry.uesb.br/sig-testes/timeeventos-frontend:latest .
docker build --no-cache -f backend/Dockerfile.prod -t registry.uesb.br/sig-testes/timeeventos-backend:latest .
```

### Container não inicia ou fica em "Starting"

**Verificações:**
```bash
# Verificar logs detalhados
docker logs sistema-producao_backend_1

# Verificar formato dos scripts dentro do container
docker exec sistema-producao_backend_1 file /app/init.sh
```

### Problemas de Charset ou Encoding

**Verificações:**
```bash
# Verificar se os scripts estão corretos
docker exec sistema-producao_backend_1 head -5 /app/init.sh
docker exec sistema-producao_frontend_1 head -5 /usr/local/bin/entrypoint.sh
```

## ✅ Checklist de Build

- [ ] Git configurado com `core.autocrlf false`
- [ ] Scripts têm quebras de linha Unix (LF) ou serão convertidos automaticamente
- [ ] Arquivo `frontend-entrypoint.sh` existe na raiz
- [ ] Arquivo `nginx-frontend.conf` existe na raiz
- [ ] Arquivo `backend/init-prod.sh` existe e tem permissões de execução
- [ ] Imagens usam Debian Bookworm como base
- [ ] Dockerfiles incluem `dos2unix` para conversão automática
- [ ] Entrypoints usam `/bin/bash` explicitamente
- [ ] Scripts incluem `set -e` para tratamento de erros
- [ ] Comando de build do frontend usa contexto `.` (raiz)
- [ ] Comando de build do backend usa contexto `.` (raiz) 
- [ ] Imagens construídas com `--no-cache` obrigatório
- [ ] Logs de inicialização aparecem corretamente
- [ ] Entrypoints executam sem erros de sintaxe

## 🎯 Comandos Finais Corretos

```bash
# Configurar Git (apenas primeira vez)
git config core.autocrlf false

# Frontend (com --no-cache obrigatório)
docker build --no-cache -f Dockerfile.frontend.prod -t registry.uesb.br/sig-testes/timeeventos-frontend:latest .

# Backend (com --no-cache obrigatório)
docker build --no-cache -f backend/Dockerfile.prod -t registry.uesb.br/sig-testes/timeeventos-backend:latest .

# Push
docker push registry.uesb.br/sig-testes/timeeventos-frontend:latest
docker push registry.uesb.br/sig-testes/timeeventos-backend:latest
```

## 🔄 Atualizações

Para atualizar o sistema:

1. **Corrigir** formato de arquivos se necessário (Dockerfiles fazem automaticamente)
2. **Reconstruir** as imagens com `--no-cache` obrigatório
3. **Fazer push** das novas versões
4. **No Portainer** → Stacks → seu-stack → "Redeploy"
5. **Monitorar** os logs para garantir inicialização correta

## 🚨 Avisos Importantes

- **SEMPRE** use `--no-cache` ao construir as imagens de produção
- **SEMPRE** use o contexto `.` (raiz do projeto) para ambos os builds
- **NÃO** modifique os scripts manualmente - deixe `dos2unix` fazer a conversão
- **VERIFIQUE** os logs de inicialização para garantir que tudo está funcionando

Os entrypoints agora garantem inicialização robusta e compatível com Debian Bookworm, proporcionando maior confiabilidade no deploy.
