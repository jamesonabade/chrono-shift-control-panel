
# Deploy de Produção - Sistema Independente

Este documento explica como realizar o deploy do sistema em produção usando **APENAS Portainer**, sem necessidade de arquivos locais no servidor.

## 🎯 Características do Sistema de Produção

### ✅ **Totalmente Independente**
- **Sem dependência de arquivos locais** no servidor
- Deploy completo via Portainer Stack
- Volumes gerenciados automaticamente pelo Docker
- Configuração via variáveis de ambiente

### ✅ **Auto-configuração Completa**
- Detecta automaticamente o ambiente de execução
- Configura endpoints baseado nas variáveis
- Suporte completo a subpaths (ex: `/scripts`)
- Persistência de dados garantida

### ✅ **Autenticação Centralizada**
- Sistema de usuários no backend
- Configurações globais acessíveis de qualquer dispositivo
- Senhas configuráveis via variáveis de ambiente
- JWT para segurança das sessões

## 🚀 Deploy Rápido com Portainer

### Passo 1: Criar Stack no Portainer

1. **Acesse Portainer** → Stacks → Add stack
2. **Nome**: `sistema-producao` (ou qualquer nome)
3. **Cole o conteúdo** do `docker-compose.prod.yml`

### Passo 2: Configurar Variáveis de Ambiente

Na seção "Environment variables" do Portainer, adicione:

```env
# === CONFIGURAÇÃO BÁSICA ===
STACK_NAME=sistema-producao
NODE_ENV=production

# === DOMÍNIO E CONTEXTO ===
DOMAIN=seu-dominio.com
BASE_PATH=/scripts

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

### Passo 3: Deploy

1. **Clique em "Deploy the stack"**
2. **Aguarde** o build das imagens (pode demorar alguns minutos)
3. **Acesse** o sistema via URL configurada

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
- `sistema_data_[stack-name]` - Configurações e dados
- `sistema_scripts_[stack-name]` - Scripts salvos
- `sistema_logs_[stack-name]` - Logs do sistema
- `sistema_uploads_[stack-name]` - Arquivos enviados

### Backup dos Dados

```bash
# Listar volumes
docker volume ls | grep sistema

# Backup de um volume específico
docker run --rm \
  -v sistema_data_sistema-producao:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/backup-data-$(date +%Y%m%d).tar.gz -C /data .

# Backup de todos os volumes
for vol in $(docker volume ls -q | grep sistema); do
  docker run --rm \
    -v $vol:/data \
    -v $(pwd):/backup \
    alpine tar czf /backup/backup-$vol-$(date +%Y%m%d).tar.gz -C /data .
done
```

### Restaurar Backup

```bash
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
docker ps | grep sistema

# Logs em tempo real
docker logs -f sistema-producao_backend_1

# Health check
curl https://seu-dominio.com/scripts/api/health
```

### Logs do Sistema

Os logs ficam disponíveis em:
- **Container logs**: `docker logs [container]`
- **Volume logs**: No volume `sistema_logs_[stack-name]`
- **Sistema**: Acessível via interface web

## 🔄 Atualizações

### Atualizar Sistema

1. **No Portainer** → Stacks → seu-stack → Editor
2. **Modifique** as versões das imagens se necessário
3. **Clique** em "Update the stack"
4. **Aguarde** a atualização dos containers

### Força Rebuild

Se precisar forçar rebuild completo:
1. **Stop** o stack
2. **Remove** o stack (os volumes permanecem)
3. **Recrie** o stack com as mesmas configurações

## 🛡️ Segurança

### Práticas Recomendadas

1. **Altere** as senhas padrão imediatamente
2. **Use** senhas fortes para `ADMIN_PASSWORD` e `USER_PASSWORD`
3. **Gere** uma chave `JWT_SECRET` aleatória e segura
4. **Configure** `CORS_ORIGIN` adequadamente
5. **Use** HTTPS em produção

### Geração de Senhas Seguras

```bash
# Senha aleatória forte
openssl rand -base64 32

# JWT Secret
openssl rand -hex 64
```

## ❗ Troubleshooting

### Container não inicia
```bash
# Verificar logs do container
docker logs sistema-producao_backend_1

# Verificar variáveis de ambiente
docker exec sistema-producao_backend_1 env | grep -E "DOMAIN|BASE_PATH"
```

### Endpoints não funcionam
1. Verificar variáveis `VITE_API_URL` e `VITE_BASE_PATH`
2. Verificar configuração do nginx principal
3. Testar health check: `curl seu-dominio.com/scripts/api/health`

### Dados não persistem
1. Verificar se volumes estão sendo criados: `docker volume ls`
2. Verificar logs do backend para erros de permissão
3. Verificar espaço em disco do servidor

### Configurações não aparecem
1. Verificar se backend está rodando
2. Verificar conectividade entre frontend e backend
3. Verificar se arquivo de configuração foi criado em `/app/data`

## ✅ Checklist de Deploy

- [ ] Stack criado no Portainer
- [ ] Variáveis de ambiente configuradas
- [ ] Senhas alteradas para valores seguros
- [ ] Nginx principal configurado (se usando subpath)
- [ ] Health check funcionando
- [ ] Login com usuários configurados
- [ ] Upload de scripts funcionando
- [ ] Configurações sendo persistidas
- [ ] Acessível de diferentes computadores
- [ ] Backup configurado

---

**🎉 Pronto!** Seu sistema está completamente independente e funcional em produção, acessível de qualquer computador sem dependências locais.
