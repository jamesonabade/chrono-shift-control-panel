
# Deploy de Produção - Sistema Totalmente Independente

Este documento explica como realizar o deploy do sistema em produção usando **APENAS Portainer**, sem necessidade de arquivos locais no servidor.

## 🎯 Características do Sistema de Produção

### ✅ **Totalmente Independente**
- **Sem dependência de arquivos locais** no servidor
- Deploy completo via Portainer Stack
- Volumes gerenciados automaticamente pelo Docker
- Configuração via variáveis de ambiente
- **Banco de dados PostgreSQL incluído**

### ✅ **Auto-configuração Completa**
- Detecta automaticamente o ambiente de execução
- Configura endpoints baseado nas variáveis
- Suporte completo a subpaths (ex: `/scripts`)
- Persistência de dados garantida
- **Build automático do código ou uso de imagens pré-construídas**

### ✅ **Autenticação Centralizada**
- Sistema de usuários no backend com banco de dados
- Configurações globais acessíveis de qualquer dispositivo
- Senhas configuráveis via variáveis de ambiente
- JWT para segurança das sessões

## 🚀 Deploy Rápido com Portainer

### Passo 1: Preparar o Repositório

**Opção A: Build Automático (Recomendado)**
1. **Suba seu código** para GitHub/GitLab
2. **Configure as variáveis**:
   ```env
   GITHUB_USER=seu-usuario
   GITHUB_REPO=seu-repositorio
   ```

**Opção B: Imagens Pré-construídas**
1. **Construa as imagens** (ver `docs/BUILD-IMAGES.md`)
2. **Configure as variáveis**:
   ```env
   FRONTEND_IMAGE=meu-registry/sistema-frontend:latest
   BACKEND_IMAGE=meu-registry/sistema-backend:latest
   ```

### Passo 2: Criar Stack no Portainer

1. **Acesse Portainer** → Stacks → Add stack
2. **Nome**: `sistema-producao` (ou qualquer nome)
3. **Cole o conteúdo** do `docker-compose.prod.yml`

### Passo 3: Configurar Variáveis de Ambiente

Na seção "Environment variables" do Portainer, adicione:

```env
# === CONFIGURAÇÃO BÁSICA ===
STACK_NAME=sistema-producao
NODE_ENV=production

# === REPOSITÓRIO (para build automático) ===
GITHUB_USER=seu-usuario
GITHUB_REPO=seu-repositorio

# === DOMÍNIO E CONTEXTO ===
DOMAIN=seu-dominio.com
BASE_PATH=/scripts

# === BANCO DE DADOS ===
POSTGRES_DB=sistema_db
POSTGRES_USER=sistema_user
POSTGRES_PASSWORD=sua-senha-db-muito-segura

# === ENDPOINTS (auto-configurados) ===
VITE_API_URL=/scripts/api
VITE_BASE_PATH=/scripts
VITE_PUBLIC_URL=https://seu-dominio.com/scripts

# === SEGURANÇA (ALTERE!) ===
ADMIN_PASSWORD=sua-senha-admin-muito-segura
USER_PASSWORD=sua-senha-user-segura
JWT_SECRET=chave-jwt-super-secreta-aleatoria

# === PERSONALIZAÇÃO ===
SYSTEM_TITLE=PAINEL DE CONTROLE
SYSTEM_SUBTITLE=Sistema de Gerenciamento Docker
```

### Passo 4: Deploy

1. **Clique em "Deploy the stack"**
2. **Aguarde** o build das imagens (pode demorar 5-10 minutos)
3. **Verifique** os logs dos containers
4. **Acesse** o sistema via URL configurada

## 📋 Configurações por Ambiente

### Para Domínio Principal
```env
DOMAIN=sistema.empresa.com
BASE_PATH=
VITE_API_URL=/api
VITE_BASE_PATH=/
VITE_PUBLIC_URL=https://sistema.empresa.com
```

### Para Subpath
```env
DOMAIN=empresa.com
BASE_PATH=/sistema
VITE_API_URL=/sistema/api
VITE_BASE_PATH=/sistema
VITE_PUBLIC_URL=https://empresa.com/sistema
```

### Para Desenvolvimento
```env
DOMAIN=localhost
BASE_PATH=
VITE_API_URL=http://localhost/api
VITE_BASE_PATH=/
VITE_PUBLIC_URL=http://localhost
```

## 🔧 Configuração do Nginx Principal

### Para Subpath (Recomendado)

Configure seu nginx principal para redirecionar para o container:

```nginx
# Em /etc/nginx/sites-available/seu-site
location /scripts/ {
    proxy_pass http://localhost/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Remove /scripts do path
    rewrite ^/scripts/(.*)$ /$1 break;
}

location /scripts/api/ {
    proxy_pass http://localhost/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 💾 Gerenciamento de Dados

### Volumes Automáticos

O sistema cria automaticamente volumes nomeados:
- `sistema_data_[stack-name]` - Configurações e dados do sistema
- `sistema_scripts_[stack-name]` - Scripts salvos pelos usuários
- `sistema_logs_[stack-name]` - Logs do sistema
- `sistema_uploads_[stack-name]` - Arquivos enviados
- `sistema_db_[stack-name]` - **Dados do banco PostgreSQL**

### Backup dos Dados

```bash
# Listar volumes
docker volume ls | grep sistema

# Backup do banco de dados
docker exec sistema-producao_database_1 pg_dump -U sistema_user sistema_db > backup-db-$(date +%Y%m%d).sql

# Backup de um volume específico
docker run --rm \
  -v sistema_data_sistema-producao:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/backup-data-$(date +%Y%m%d).tar.gz -C /data .

# Backup completo automatizado
for vol in $(docker volume ls -q | grep sistema_sistema-producao); do
  docker run --rm \
    -v $vol:/data \
    -v $(pwd):/backup \
    alpine tar czf /backup/backup-$vol-$(date +%Y%m%d).tar.gz -C /data .
done
```

### Restaurar Backup

```bash
# Restaurar banco de dados
docker exec -i sistema-producao_database_1 psql -U sistema_user sistema_db < backup-db-20241201.sql

# Restaurar volume específico
docker run --rm \
  -v sistema_data_sistema-producao:/data \
  -v $(pwd):/backup \
  alpine sh -c "cd /data && tar xzf /backup/backup-data-20241201.tar.gz"
```

## 🔍 Monitoramento

### Verificar Status

```bash
# Status dos containers
docker ps | grep sistema-producao

# Logs em tempo real
docker logs -f sistema-producao_backend_1
docker logs -f sistema-producao_database_1

# Health check
curl https://seu-dominio.com/scripts/api/health

# Status do banco
docker exec sistema-producao_database_1 pg_isready -U sistema_user
```

### Logs do Sistema

Os logs ficam disponíveis em:
- **Container logs**: `docker logs [container]`
- **Volume logs**: No volume `sistema_logs_[stack-name]`
- **Sistema**: Acessível via interface web
- **Banco de dados**: Logs do PostgreSQL nos logs do container

## 🔄 Atualizações

### Atualizar Sistema (Build Automático)

1. **Faça push** das alterações para o repositório
2. **No Portainer** → Stacks → seu-stack → "Redeploy"
3. **Aguarde** o novo build e deployment

### Atualizar Sistema (Imagens Pré-construídas)

1. **Construa** novas versões das imagens
2. **Atualize** as tags no `.env`
3. **No Portainer** → Stacks → seu-stack → Editor
4. **Atualize** as versões das imagens
5. **Clique** em "Update the stack"

### Força Rebuild

Se precisar forçar rebuild completo:
1. **Stop** o stack
2. **Remove** o stack (os volumes permanecem)
3. **Recrie** o stack com as mesmas configurações

## 🛡️ Segurança

### Práticas Recomendadas

1. **Altere** as senhas padrão imediatamente
2. **Use** senhas fortes para todas as senhas
3. **Gere** uma chave `JWT_SECRET` aleatória e segura
4. **Configure** `CORS_ORIGIN` adequadamente
5. **Use** HTTPS em produção
6. **Mantenha** o banco de dados seguro

### Geração de Senhas Seguras

```bash
# Senhas aleatórias fortes
openssl rand -base64 32

# JWT Secret (64 caracteres hex)
openssl rand -hex 64

# Para usar no .env
echo "ADMIN_PASSWORD=$(openssl rand -base64 32)"
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)"
echo "JWT_SECRET=$(openssl rand -hex 64)"
```

## ❗ Troubleshooting

### Container não inicia
```bash
# Verificar logs do container
docker logs sistema-producao_backend_1
docker logs sistema-producao_database_1

# Verificar variáveis de ambiente
docker exec sistema-producao_backend_1 env | grep -E "DOMAIN|BASE_PATH|DB_"
```

### Banco de dados não conecta
```bash
# Verificar se o banco está rodando
docker exec sistema-producao_database_1 pg_isready -U sistema_user

# Verificar logs do banco
docker logs sistema-producao_database_1

# Testar conexão manual
docker exec -it sistema-producao_database_1 psql -U sistema_user -d sistema_db
```

### Endpoints não funcionam
1. Verificar variáveis `VITE_API_URL` e `VITE_BASE_PATH`
2. Verificar configuração do nginx principal
3. Testar health check: `curl seu-dominio.com/scripts/api/health`
4. Verificar se o backend está conectado ao banco

### Build falha
1. Verificar se o repositório está público ou se tem acesso
2. Verificar logs de build no Portainer
3. Verificar se as variáveis `GITHUB_USER` e `GITHUB_REPO` estão corretas
4. Tentar fazer build local primeiro

## ✅ Checklist de Deploy

- [ ] Stack criado no Portainer
- [ ] Variáveis de ambiente configuradas
- [ ] Repositório Git configurado (se build automático)
- [ ] Senhas alteradas para valores seguros
- [ ] Banco de dados configurado
- [ ] Nginx principal configurado (se usando subpath)
- [ ] Health check funcionando (sistema e banco)
- [ ] Login com usuários configurados
- [ ] Upload de scripts funcionando
- [ ] Configurações sendo persistidas no banco
- [ ] Acessível de diferentes computadores
- [ ] Backup configurado (sistema e banco)

---

**🎉 Pronto!** Seu sistema está completamente independente e funcional em produção, com banco de dados PostgreSQL, acessível de qualquer computador sem dependências locais.

Para mais detalhes sobre construção de imagens, consulte `docs/BUILD-IMAGES.md`.
