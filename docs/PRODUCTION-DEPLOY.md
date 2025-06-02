
# Guia de Deploy em Produção - TimeEventos

## Visão Geral
Este guia detalha como fazer o deploy do sistema TimeEventos em ambiente de produção usando Docker e registry privado.

## Pré-requisitos

### Servidor de Produção
- **CPU**: 2 cores mínimo
- **RAM**: 4GB mínimo
- **Disco**: 20GB SSD
- **OS**: Ubuntu 20.04+ ou similar
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### Registry Privado
- Registry Docker configurado (ex: Harbor, GitLab Registry, AWS ECR)
- Credenciais de acesso (username/password ou token)

## Configuração Inicial

### 1. Preparação do Ambiente Local (Desenvolvimento)

```bash
# Clone do projeto
git clone <repositorio>
cd timeeventos

# Dar permissão aos scripts
chmod +x build-deploy.sh
chmod +x scripts/*.sh
```

### 2. Build e Push das Imagens

#### Usando o Script Automatizado (Recomendado)

```bash
# Para desenvolvimento
./build-deploy.sh dev

# Para produção
./build-deploy.sh prod
```

Na primeira execução, o script solicitará:
- URL do registry (ex: my-registry.com)
- Username do registry
- Password/Token do registry

As configurações são salvas em `.registry-config` (adicione ao .gitignore).

#### Build Manual

```bash
# Configurar variáveis
export REGISTRY_URL="my-registry.com"
export TAG="$(date +%Y%m%d-%H%M%S)"

# Login no registry
docker login $REGISTRY_URL

# Build e push
./scripts/build-and-push.sh
```

## Deploy no Servidor de Produção

### 1. Preparação do Servidor

```bash
# Atualização do sistema
sudo apt update && sudo apt upgrade -y

# Instalação do Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalação do Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Reiniciar sessão
logout
```

### 2. Configuração do Projeto

```bash
# Clone do projeto
git clone <repositorio>
cd timeeventos

# Criar estrutura
mkdir -p {scripts,logs,config}
chmod 755 scripts logs

# Configurar permissões
sudo chown -R $USER:$USER .
```

### 3. Deploy das Aplicações

#### Método 1: Script Automatizado

```bash
# Configurar variáveis de ambiente
export REGISTRY_URL="my-registry.com"
export TAG="20241201-1430"  # Use a tag criada no build
export SERVER_HOST="production-server.com"  # IP ou domínio do servidor

# Executar deploy
./scripts/deploy-production.sh
```

#### Método 2: Docker Compose Manual

```bash
# Configurar variáveis
export REGISTRY_URL="my-registry.com"
export TAG="latest"

# Criar configuração do frontend
cat > config/config.js << EOF
window.APP_CONFIG = {
  API_URL: 'http://localhost:3001'
};
EOF

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Verificação do Deploy

```bash
# Verificar containers
docker-compose -f docker-compose.prod.yml ps

# Verificar logs
docker-compose -f docker-compose.prod.yml logs -f

# Teste de conectividade
curl http://localhost:8080  # Frontend
curl http://localhost:3001/api/scripts  # Backend
```

## Configuração de Proxy Reverso

### Nginx

```bash
# Instalação
sudo apt install nginx

# Configuração
sudo tee /etc/nginx/sites-available/timeeventos << EOF
server {
    listen 80;
    server_name seu-dominio.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Ativar site
sudo ln -s /etc/nginx/sites-available/timeeventos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL com Let's Encrypt

```bash
# Instalação do Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu-dominio.com

# Renovação automática
sudo crontab -e
# Adicionar: 0 2 * * * certbot renew --quiet
```

## Configurações de Ambiente

### Variáveis de Ambiente Importantes

#### Frontend
- `NODE_ENV=production`
- `TZ=America/Bahia`

#### Backend
- `NODE_ENV=production`
- `TZ=America/Bahia`

### Configuração de API URL

O frontend usa configuração dinâmica através do arquivo `config/config.js`:

```javascript
// Produção com domínio específico
window.APP_CONFIG = {
  API_URL: 'https://api.timeeventos.com'
};

// Produção com mesmo servidor
window.APP_CONFIG = {
  API_URL: 'http://servidor-producao:3001'
};
```

## Monitoramento

### Scripts de Monitoramento

#### Health Check Automatizado

```bash
#!/bin/bash
# health-check.sh

echo "=== TimeEventos Health Check - $(date) ==="

# Verificar containers
echo "Containers Status:"
docker-compose -f docker-compose.prod.yml ps

# Verificar conectividade
echo -e "\nFrontend Check:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080

echo -e "\nBackend Check:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/scripts

# Verificar recursos
echo -e "\nDisk Usage:"
df -h

echo -e "\nMemory Usage:"
free -h

# Logs recentes com erro
echo -e "\nRecent Errors:"
docker-compose -f docker-compose.prod.yml logs --tail=10 | grep -i error
```

#### Backup Automatizado

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/home/$USER/backups"
DATE=$(date +%Y%m%d_%H%M%S)
PROJECT_DIR="/home/$USER/timeeventos"

mkdir -p $BACKUP_DIR

# Backup de dados importantes
cd $PROJECT_DIR
tar -czf $BACKUP_DIR/timeeventos-backup-$DATE.tar.gz scripts/ logs/ config/

# Manter apenas 7 backups
find $BACKUP_DIR -name "timeeventos-backup-*.tar.gz" -type f -mtime +7 -delete

echo "Backup concluído: timeeventos-backup-$DATE.tar.gz"
```

### Automação com Crontab

```bash
# Editar crontab
crontab -e

# Adicionar jobs
# Health check a cada 30 minutos
*/30 * * * * /home/$USER/timeeventos/health-check.sh >> /home/$USER/health.log 2>&1

# Backup diário às 2h
0 2 * * * /home/$USER/timeeventos/backup.sh >> /home/$USER/backup.log 2>&1

# Limpeza de logs semanalmente
0 3 * * 0 docker-compose -f /home/$USER/timeeventos/docker-compose.prod.yml exec timeeventos-backend find /app/logs -name "*.log" -mtime +30 -delete
```

## Atualizações

### Processo de Atualização

1. **Build nova versão**:
```bash
./build-deploy.sh prod
```

2. **Deploy no servidor**:
```bash
# Parar containers atuais
docker-compose -f docker-compose.prod.yml down

# Atualizar variável TAG para nova versão
export TAG="nova-tag"

# Fazer backup antes da atualização
./backup.sh

# Deploy nova versão
docker-compose -f docker-compose.prod.yml up -d
```

3. **Verificar funcionamento**:
```bash
./health-check.sh
```

### Rollback

```bash
# Parar containers
docker-compose -f docker-compose.prod.yml down

# Voltar para tag anterior
export TAG="tag-anterior"

# Deploy versão anterior
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Problemas Comuns

#### 1. Containers não iniciam
```bash
# Verificar logs detalhados
docker-compose -f docker-compose.prod.yml logs timeeventos-backend
docker-compose -f docker-compose.prod.yml logs timeeventos-frontend

# Verificar permissões Docker
groups $USER
sudo usermod -aG docker $USER
```

#### 2. API não conecta
```bash
# Verificar configuração do frontend
cat config/config.js

# Verificar rede Docker
docker network ls
docker network inspect timeeventos_default
```

#### 3. Scripts não executam
```bash
# Verificar permissões
docker-compose -f docker-compose.prod.yml exec timeeventos-backend ls -la /app/scripts

# Verificar timezone
docker-compose -f docker-compose.prod.yml exec timeeventos-backend date
```

#### 4. Problemas de Registry
```bash
# Verificar login
docker login $REGISTRY_URL

# Verificar conectividade
ping $REGISTRY_URL

# Logs de pull
docker-compose -f docker-compose.prod.yml pull
```

## Segurança

### Firewall
```bash
# Configurar UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Backup de Segurança
- Sempre fazer backup antes de atualizações
- Manter backups em local separado do servidor
- Testar restauração de backups periodicamente

## Comandos Úteis

```bash
# Ver status dos containers
docker-compose -f docker-compose.prod.yml ps

# Ver logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f

# Reiniciar serviços
docker-compose -f docker-compose.prod.yml restart

# Atualizar imagens
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Limpar recursos não utilizados
docker system prune -a
```

---

**Versão**: 1.0  
**Projeto**: TimeEventos  
**Última Atualização**: 2024-12-01
