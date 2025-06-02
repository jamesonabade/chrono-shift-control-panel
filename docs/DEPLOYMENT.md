
# Guia de Deploy Detalhado

## Ambiente de Desenvolvimento

### Pré-requisitos
```bash
# Node.js 18+
node --version

# Docker 20.10+
docker --version

# Docker Compose 2.0+
docker-compose --version
```

### Setup Local
```bash
# Clone do projeto
git clone <repositorio>
cd chrono-shift-control-panel

# Install dependencies (se necessário)
npm install

# Start desenvolvimento
docker-compose up -d

# Verificar status
docker-compose ps
```

## Deploy em Produção

### 1. Servidor VPS/Cloud

#### Especificações Mínimas
- **CPU**: 2 cores
- **RAM**: 4GB
- **Disco**: 20GB SSD
- **OS**: Ubuntu 20.04+ ou similar

#### Configuração Inicial
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

#### Clone e Configuração
```bash
# Clone do projeto
git clone <repositorio>
cd chrono-shift-control-panel

# Criar estrutura de produção
mkdir -p {scripts,logs,backups}
chmod 755 scripts logs

# Configurar permissões
sudo chown -R $USER:$USER .
```

#### Docker Compose para Produção
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - VITE_API_URL=https://seu-dominio.com/api
    volumes:
      - scripts_data:/app/scripts
      - logs_data:/app/logs
    restart: unless-stopped
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    volumes:
      - scripts_data:/app/scripts
      - logs_data:/app/logs
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    privileged: true
    user: root

volumes:
  scripts_data:
  logs_data:
```

### 3. Proxy Reverso com Nginx

#### Instalação
```bash
sudo apt install nginx certbot python3-certbot-nginx
```

#### Configuração
```nginx
# /etc/nginx/sites-available/chrono-control
server {
    listen 80;
    server_name seu-dominio.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com;
    
    # SSL Configuration (será adicionado pelo certbot)
    
    # Frontend
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

#### Ativação
```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/chrono-control /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 4. SSL com Let's Encrypt

```bash
# Obter certificado
sudo certbot --nginx -d seu-dominio.com

# Verificar renovação automática
sudo certbot renew --dry-run

# Adicionar ao crontab para renovação
sudo crontab -e
# Adicionar: 0 2 * * * certbot renew --quiet
```

### 5. Deploy Final

```bash
# Build e start dos containers
docker-compose -f docker-compose.prod.yml up -d --build

# Verificar status
docker-compose -f docker-compose.prod.yml ps

# Verificar logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Monitoramento e Manutenção

### Scripts de Monitoramento

#### Health Check
```bash
#!/bin/bash
# health-check.sh

echo "=== Health Check - $(date) ==="

# Verificar containers
echo "Containers Status:"
docker-compose -f docker-compose.prod.yml ps

# Verificar conectividade
echo -e "\nFrontend Check:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080

echo -e "\nBackend Check:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/scripts

# Verificar espaço em disco
echo -e "\nDisk Usage:"
df -h

# Verificar logs recentes
echo -e "\nRecent Errors:"
docker-compose -f docker-compose.prod.yml logs --tail=10 | grep -i error
```

#### Backup Automatizado
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/home/$USER/backups"
DATE=$(date +%Y%m%d_%H%M%S)
PROJECT_DIR="/home/$USER/chrono-shift-control-panel"

mkdir -p $BACKUP_DIR

# Backup de scripts e logs
cd $PROJECT_DIR
tar -czf $BACKUP_DIR/chrono-backup-$DATE.tar.gz scripts/ logs/

# Manter apenas 7 backups mais recentes
find $BACKUP_DIR -name "chrono-backup-*.tar.gz" -type f -mtime +7 -delete

echo "Backup concluído: chrono-backup-$DATE.tar.gz"
```

### Automação com Crontab

```bash
# Editar crontab
crontab -e

# Adicionar jobs
# Health check a cada 15 minutos
*/15 * * * * /home/$USER/health-check.sh >> /home/$USER/health.log 2>&1

# Backup diário às 2h
0 2 * * * /home/$USER/backup.sh >> /home/$USER/backup.log 2>&1

# Limpeza de logs semanalmente
0 3 * * 0 docker-compose -f /home/$USER/chrono-shift-control-panel/docker-compose.prod.yml exec backend find /app/logs -name "*.log" -mtime +30 -delete
```

## Troubleshooting de Deploy

### Problemas Comuns

#### 1. Permissões Docker
```bash
# Verificar se usuário está no grupo docker
groups $USER

# Adicionar ao grupo
sudo usermod -aG docker $USER
newgrp docker
```

#### 2. Porta já em uso
```bash
# Verificar portas ocupadas
sudo netstat -tulpn | grep :8080
sudo netstat -tulpn | grep :3001

# Matar processos se necessário
sudo kill -9 <PID>
```

#### 3. Problemas de SSL
```bash
# Verificar certificados
sudo certbot certificates

# Renovar manualmente
sudo certbot renew

# Logs do certbot
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

#### 4. Containers não iniciam
```bash
# Verificar logs detalhados
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# Rebuild completo
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## Rollback de Deploy

### Processo de Rollback
```bash
# 1. Parar containers atuais
docker-compose -f docker-compose.prod.yml down

# 2. Fazer checkout para versão anterior
git checkout <previous-commit>

# 3. Rebuild e restart
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# 4. Verificar funcionamento
./health-check.sh
```

### Backup Antes de Deploy
```bash
# Sempre fazer backup antes de deploy
./backup.sh

# Ou backup manual
tar -czf pre-deploy-backup-$(date +%Y%m%d).tar.gz scripts/ logs/
```
