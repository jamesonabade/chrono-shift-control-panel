
# Deploy de Produção - Sistema de Gerenciamento

Este documento explica como realizar o deploy do sistema em produção usando Docker e Portainer.

## 🎯 Características do Sistema de Produção

### ✅ Configurações Centralizadas
- Todas as configurações são armazenadas no backend
- Configurações persistem entre reinicializações
- Acessível de qualquer computador/dispositivo
- Não depende de localStorage do navegador

### ✅ Autenticação Segura
- Senhas configuráveis via variáveis de ambiente
- Sistema de permissões persistente
- Logs de acesso centralizados

### ✅ Dados Persistentes
- Scripts, logs e configurações em volumes nomeados
- Backup automático de configurações
- Não perde dados ao reiniciar containers

### ✅ Auto-configuração
- Detecta automaticamente o ambiente
- Configura endpoints baseado no contexto
- Suporte completo a subpaths (ex: `/scripts`)

## 🐳 Deploy com Docker Compose

### 1. Preparar Ambiente

```bash
# Clonar/baixar código fonte
git clone <seu-repositorio>
cd sistema-gerenciamento

# Criar diretórios para volumes
mkdir -p data scripts logs uploads ssl

# Definir permissões
chmod 755 data scripts logs uploads
```

### 2. Configurar Variáveis de Ambiente

Crie o arquivo `.env` baseado no `.env.example`:

```bash
cp .env.example .env
nano .env
```

**Configuração mínima para produção:**

```env
# Domínio e contexto
DOMAIN=lab.sigdev.uesb.br
BASE_PATH=/scripts

# URLs da aplicação
VITE_API_URL=https://lab.sigdev.uesb.br/scripts/api
VITE_BASE_PATH=/scripts
VITE_PUBLIC_URL=https://lab.sigdev.uesb.br/scripts

# Senhas seguras (ALTERE ESTAS!)
ADMIN_PASSWORD=sua-senha-admin-muito-segura
USER_PASSWORD=sua-senha-user-segura

# Chave JWT (gere uma aleatória)
JWT_SECRET=chave-jwt-super-secreta-aleatoria

# Caminhos dos volumes no host
DATA_PATH=/opt/sistema-gerenciamento/data
SCRIPTS_PATH=/opt/sistema-gerenciamento/scripts
LOGS_PATH=/opt/sistema-gerenciamento/logs
UPLOADS_PATH=/opt/sistema-gerenciamento/uploads
```

### 3. Executar Deploy

```bash
# Build e iniciar containers
docker-compose -f docker-compose.prod.yml up -d --build

# Verificar status
docker-compose -f docker-compose.prod.yml ps

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 🌐 Deploy com Portainer Stack

### 1. Criar Stack no Portainer

1. Acesse Portainer > Stacks > Add stack
2. Nome: `sistema-gerenciamento`
3. Cole o conteúdo do `docker-compose.prod.yml`

### 2. Configurar Variáveis de Ambiente

Na seção "Environment variables" do Portainer, adicione:

```
DOMAIN=seu-dominio.com
BASE_PATH=/scripts
VITE_API_URL=https://seu-dominio.com/scripts/api
VITE_BASE_PATH=/scripts
VITE_PUBLIC_URL=https://seu-dominio.com/scripts
ADMIN_PASSWORD=sua-senha-admin-segura
USER_PASSWORD=sua-senha-user-segura
JWT_SECRET=sua-chave-jwt-super-secreta
DATA_PATH=/opt/sistema/data
SCRIPTS_PATH=/opt/sistema/scripts
LOGS_PATH=/opt/sistema/logs
UPLOADS_PATH=/opt/sistema/uploads
```

### 3. Deploy Stack

1. Clique em "Deploy the stack"
2. Aguarde o build das imagens
3. Verifique os logs dos containers

## ⚙️ Configuração do Nginx

### Para Subpath (ex: `/scripts`)

Configurar proxy reverso no nginx principal:

```nginx
# /etc/nginx/sites-available/seu-site
location /scripts/ {
    proxy_pass http://localhost/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Remover /scripts do path antes de enviar para o container
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

### Para Domínio Dedicado

```nginx
server {
    listen 80;
    server_name sistema.seu-dominio.com;
    
    location / {
        proxy_pass http://localhost/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔧 Manutenção e Monitoramento

### Backup de Dados

```bash
# Backup manual
tar -czf backup-$(date +%Y%m%d).tar.gz data/ scripts/ logs/

# Backup automático (crontab)
0 2 * * * cd /opt/sistema && tar -czf /backups/backup-$(date +\%Y\%m\%d).tar.gz data/ scripts/ logs/
```

### Logs do Sistema

```bash
# Ver logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f backend

# Ver logs específicos
docker-compose -f docker-compose.prod.yml logs nginx
docker-compose -f docker-compose.prod.yml logs frontend
```

### Atualizações

```bash
# Atualizar sistema
git pull
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Verificar health
curl -f http://localhost/api/health
```

## 🔍 Troubleshooting

### Container Backend não inicia
```bash
# Verificar logs
docker-compose -f docker-compose.prod.yml logs backend

# Verificar permissões dos volumes
ls -la data/ scripts/ logs/

# Recriar volumes
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
```

### Configurações não persistem
- Verificar se volumes estão mapeados corretamente
- Verificar se backend está salvando no `/app/data`
- Verificar logs do backend para erros

### Endpoints incorretos
- Verificar variáveis `VITE_API_URL` e `VITE_BASE_PATH`
- Verificar configuração do nginx
- Testar health check: `curl https://seu-dominio.com/seu-path/api/health`

### Problemas de permissão
```bash
# Corrigir permissões
sudo chown -R $(whoami):$(whoami) data/ scripts/ logs/
chmod -R 755 data/ scripts/ logs/
```

## 📋 Checklist de Deploy

- [ ] Configurar variáveis de ambiente
- [ ] Criar diretórios de volumes no host
- [ ] Configurar nginx/proxy reverso
- [ ] Testar health check
- [ ] Fazer login com usuários padrão
- [ ] Alterar senhas padrão
- [ ] Configurar backup automático
- [ ] Testar upload de scripts
- [ ] Verificar persistência de configurações
- [ ] Documentar configurações específicas

---

**Importante:** Este sistema foi projetado para ser totalmente independente e auto-configurável. Todas as configurações ficam centralizadas no backend e são acessíveis de qualquer computador.
