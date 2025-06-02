
# Guia de Deploy em Produção - TimeEventos

## Visão Geral
Este guia detalha como fazer o deploy do sistema TimeEventos em ambiente de produção usando Docker e registry privado com configuração unificada.

## Arquitetura Simplificada
- **Um único Dockerfile** para frontend (suporta dev e prod)
- **Um único Dockerfile** para backend
- **Um único docker-compose.yml** para desenvolvimento local
- **Configuração centralizada** da API em arquivo `.env.build`
- **Script unificado** para build e deploy

## Pré-requisitos

### Servidor de Produção
- **CPU**: 2 cores mínimo
- **RAM**: 4GB mínimo
- **Disco**: 20GB SSD
- **OS**: Ubuntu 20.04+ ou similar
- **Docker**: 20.10+

### Registry Privado
- Registry Docker configurado (ex: Harbor, GitLab Registry, AWS ECR)
- Credenciais de acesso (username/password ou token)

## Configuração e Build

### 1. Preparação do Ambiente Local

```bash
# Clone do projeto
git clone <repositorio>
cd timeeventos

# Dar permissão aos scripts
chmod +x build-deploy.sh
```

### 2. Configuração da API

O endereço da API é configurado automaticamente durante o processo de build:

- **Desenvolvimento**: `http://timeeventos-backend:3001` (padrão)
- **Produção**: Informado pelo usuário durante o build

### 3. Build e Push das Imagens

#### Script Automatizado (Recomendado)

```bash
# Executar script unificado
./build-deploy.sh

# No Windows
build-deploy.bat
```

Na primeira execução, o script solicitará:

1. **Ambiente**: Desenvolvimento ou Produção
2. **Endereço da API**: (se produção, senão usa padrão)
3. **URL do Registry**: ex: `registry.uesb.br`
4. **Diretório**: ex: `timeeventos`
5. **Nome do projeto**: ex: `timeeventos` (padrão)
6. **Tag**: ex: `latest` (padrão)
7. **Credenciais do Registry**: username e password

**Formato das imagens geradas:**
```
registry.uesb.br/timeeventos/timeeventos-frontend:latest
registry.uesb.br/timeeventos/timeeventos-backend:latest
```

### 4. Configurações Salvas

As configurações são salvas automaticamente:
- **Linux/Mac**: `.build-config`
- **Windows**: `.build-config.bat`

**IMPORTANTE**: Adicione esses arquivos ao `.gitignore`:
```
.build-config
.build-config.bat
.env.build
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

# Reiniciar sessão
logout
```

### 2. Deploy das Aplicações

#### Método 1: Containers Individuais

```bash
# Fazer login no registry
docker login registry.uesb.br

# Deploy do backend
docker run -d \
  --name timeeventos-backend \
  -p 3001:3001 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v timeeventos_scripts:/app/scripts \
  -v timeeventos_logs:/app/logs \
  --restart unless-stopped \
  registry.uesb.br/timeeventos/timeeventos-backend:latest

# Deploy do frontend
docker run -d \
  --name timeeventos-frontend \
  -p 8080:8080 \
  --link timeeventos-backend \
  --restart unless-stopped \
  registry.uesb.br/timeeventos/timeeventos-frontend:latest \
  npm run preview -- --host 0.0.0.0 --port 8080
```

#### Método 2: Docker Compose (Recomendado)

Criar arquivo `docker-compose.prod.yml` no servidor:

```yaml
version: '3.8'

services:
  timeeventos-frontend:
    image: registry.uesb.br/timeeventos/timeeventos-frontend:latest
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
    volumes:
      - scripts_data:/app/scripts
      - logs_data:/app/logs
    command: npm run preview -- --host 0.0.0.0 --port 8080
    restart: unless-stopped
    depends_on:
      - timeeventos-backend

  timeeventos-backend:
    image: registry.uesb.br/timeeventos/timeeventos-backend:latest
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

Deploy:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Verificação do Deploy

```bash
# Verificar containers
docker ps

# Verificar logs
docker logs timeeventos-frontend
docker logs timeeventos-backend

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

## Desenvolvimento Local

### Execução Normal
```bash
# Para desenvolvimento local (sem build de imagem)
docker-compose up -d
```

### Com Imagens do Registry
```bash
# Para testar imagens do registry localmente
# Execute o script e escolha ambiente "desenvolvimento"
./build-deploy.sh
# Escolha "y" quando perguntado sobre deploy local
```

## Atualizações

### Processo de Atualização

1. **Build nova versão**:
```bash
./build-deploy.sh
# As configurações existentes serão reutilizadas
```

2. **Deploy no servidor**:
```bash
# Parar containers atuais
docker-compose -f docker-compose.prod.yml down

# Fazer pull das novas imagens
docker-compose -f docker-compose.prod.yml pull

# Iniciar com novas imagens
docker-compose -f docker-compose.prod.yml up -d
```

### Configuração da API em Produção

A URL da API é configurada durante o build da imagem. Para diferentes ambientes:

- **Mesmo servidor**: `http://timeeventos-backend:3001`
- **Servidor específico**: `http://192.168.1.100:3001`
- **Domínio**: `https://api.timeeventos.com`

## Troubleshooting

### Problemas Comuns

#### 1. API não conecta
```bash
# Verificar se a API foi configurada corretamente durante o build
docker run --rm registry.uesb.br/timeeventos/timeeventos-frontend:latest cat .env

# Verificar conectividade entre containers
docker exec timeeventos-frontend ping timeeventos-backend
```

#### 2. Problemas de Registry
```bash
# Verificar login
docker login registry.uesb.br

# Verificar se as imagens existem
docker pull registry.uesb.br/timeeventos/timeeventos-frontend:latest
```

#### 3. Scripts não executam no backend
```bash
# Verificar permissões
docker exec timeeventos-backend ls -la /app/scripts

# Verificar montagem do Docker socket
docker exec timeeventos-backend docker ps
```

## Comandos Úteis

```bash
# Ver logs em tempo real
docker logs -f timeeventos-frontend
docker logs -f timeeventos-backend

# Reiniciar serviços
docker restart timeeventos-frontend timeeventos-backend

# Atualizar imagens
docker pull registry.uesb.br/timeeventos/timeeventos-frontend:latest
docker pull registry.uesb.br/timeeventos/timeeventos-backend:latest

# Limpar recursos não utilizados
docker system prune -a
```

## Arquivos de Configuração

### Estrutura do Projeto
```
timeeventos/
├── build-deploy.sh          # Script principal de build/deploy
├── build-deploy.bat         # Versão Windows
├── .env.template            # Template de configuração
├── .env.build              # Configuração da API (criado automaticamente)
├── .build-config           # Configurações salvas (Linux/Mac)
├── .build-config.bat       # Configurações salvas (Windows)
├── Dockerfile              # Dockerfile unificado frontend
├── backend/
│   └── Dockerfile          # Dockerfile backend
├── docker-compose.yml      # Para desenvolvimento local
└── docs/
    └── PRODUCTION-DEPLOY.md # Este documento
```

### Gitignore Recomendado
```
.build-config
.build-config.bat
.env.build
.env.local
```

---

**Versão**: 2.0  
**Projeto**: TimeEventos  
**Última Atualização**: 2024-12-02  
**Mudanças**: Arquitetura unificada com configuração centralizada
