
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

## 🚨 Problemas Comuns e Soluções

### Erro: "exec format error"

**Causa:** Arquivo de script com terminações de linha Windows (CRLF) em vez de Unix (LF)

**Soluções:**
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

3. **Usar editor com configuração Unix:**
   - VS Code: Configure `"files.eol": "\n"`
   - Notepad++: Edit → EOL Conversion → Unix (LF)

### Erro: "Syntax error: word unexpected"

**Causa:** Caracteres invisíveis ou quebras de linha incorretas nos scripts bash

**Solução:** Os Dockerfiles já incluem `dos2unix` para corrigir automaticamente

### Erro: "not found" em scripts

**Causa:** Problemas de encoding ou caracteres especiais

**Verificação:**
```bash
# Verificar encoding do arquivo
file frontend-entrypoint.sh
file backend/init-prod.sh

# Deve mostrar: "ASCII text" ou "UTF-8 Unicode text"
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
- ✅ Conversão automática de quebras de linha

### Backend
- ✅ Aguarda PostgreSQL estar disponível
- ✅ Testa conexão com banco de dados
- ✅ Configura sistema na primeira execução
- ✅ Verifica conectividade com Docker
- ✅ Logs coloridos e informativos
- ✅ Health check endpoint
- ✅ Conversão automática de quebras de linha

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

# Corrigir se necessário
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
# Re-construir imagens após corrigir scripts
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

## ✅ Checklist de Build

- [ ] Git configurado com `core.autocrlf false`
- [ ] Scripts têm quebras de linha Unix (LF)
- [ ] Arquivo `frontend-entrypoint.sh` existe na raiz
- [ ] Arquivo `nginx-frontend.conf` existe na raiz
- [ ] Arquivo `backend/init-prod.sh` existe e tem permissões de execução
- [ ] Comando de build do frontend usa contexto `.` (raiz)
- [ ] Comando de build do backend usa contexto `.` (raiz) 
- [ ] Imagens construídas com `--no-cache` se houve problemas
- [ ] Logs de inicialização aparecem corretamente
- [ ] Entrypoints executam sem erros de sintaxe

## 🎯 Comandos Finais Corretos

```bash
# Configurar Git (apenas primeira vez)
git config core.autocrlf false

# Corrigir scripts se necessário
dos2unix frontend-entrypoint.sh backend/init-prod.sh

# Frontend
docker build --no-cache -f Dockerfile.frontend.prod -t registry.uesb.br/sig-testes/timeeventos-frontend:latest .

# Backend  
docker build --no-cache -f backend/Dockerfile.prod -t registry.uesb.br/sig-testes/timeeventos-backend:latest .

# Push
docker push registry.uesb.br/sig-testes/timeeventos-frontend:latest
docker push registry.uesb.br/sig-testes/timeeventos-backend:latest
```

## 🔄 Atualizações

Para atualizar o sistema:

1. **Corrigir** formato de arquivos se necessário
2. **Reconstruir** as imagens com `--no-cache`
3. **Fazer push** das novas versões
4. **No Portainer** → Stacks → seu-stack → "Redeploy"
5. **Monitorar** os logs para garantir inicialização correta

Os entrypoints garantem que cada container seja configurado adequadamente antes de inicializar, proporcionando maior confiabilidade no deploy.
