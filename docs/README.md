
# Documentação Completa - Sistema de Gerenciamento Docker

## Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Tecnologias Utilizadas](#tecnologias-utilizadas)
4. [Funcionalidades](#funcionalidades)
5. [Autenticação e Autorização](#autenticação-e-autorização)
6. [Sistema de Logs](#sistema-de-logs)
7. [Personalização](#personalização)
8. [Deploy em Produção](#deploy-em-produção)
9. [Troubleshooting](#troubleshooting)

## Visão Geral

O Sistema de Gerenciamento Docker é uma aplicação web completa que permite o gerenciamento de containers Docker através de uma interface web intuitiva. O sistema oferece funcionalidades de administração, execução de scripts, gestão de usuários e monitoramento através de logs detalhados.

### Características Principais
- Interface web responsiva e moderna
- Sistema de autenticação com múltiplos níveis de permissão
- Execução segura de scripts bash/shell
- Monitoramento em tempo real através de logs
- Personalização completa da interface
- Arquitetura containerizada com Docker

## Arquitetura do Sistema

### Componentes Principais

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Frontend     │    │     Backend     │    │     Docker      │
│   (React/Vite)  │◄──►│   (Node.js)     │◄──►│   (Containers)  │
│                 │    │                 │    │                 │
│ - Dashboard     │    │ - API Routes    │    │ - Script Exec   │
│ - Auth System   │    │ - File Upload   │    │ - Volume Mounts │
│ - Log Viewer    │    │ - Log Manager   │    │ - Permissions   │
│ - User Mgmt     │    │ - Script Exec   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Fluxo de Dados
1. **Autenticação**: Frontend → localStorage → Dashboard
2. **Execução de Scripts**: Frontend → Backend API → Docker Container
3. **Logs**: Backend → Arquivo/Memória → Frontend API → Interface
4. **Upload de Arquivos**: Frontend → Backend Multer → Volume Docker

## Tecnologias Utilizadas

### Frontend
- **React 18**: Framework principal
- **TypeScript**: Tipagem estática
- **Vite**: Build tool e dev server
- **Tailwind CSS**: Framework de estilos
- **Shadcn/UI**: Componentes de interface
- **Tanstack Query**: Gerenciamento de estado e cache
- **React Router**: Roteamento

### Backend
- **Node.js**: Runtime JavaScript
- **Express**: Framework web
- **Multer**: Upload de arquivos
- **CORS**: Cross-origin resource sharing
- **Child Process**: Execução de scripts

### DevOps
- **Docker**: Containerização
- **Docker Compose**: Orquestração de containers
- **Alpine Linux**: Base dos containers
- **Volume Mounts**: Persistência de dados

## Funcionalidades

### 1. Configuração de Data
- Alteração da data do sistema
- Execução de scripts de configuração temporal
- Validação de formatos de data
- Log de todas as alterações

### 2. Restauração de Banco de Dados
- Upload de arquivos de backup
- Execução de scripts de restauração
- Monitoramento do processo
- Rollback em caso de erro

### 3. Gerenciamento de Scripts
- Upload de scripts (.sh, .bash)
- Preview do conteúdo dos scripts
- Edição inline com syntax highlighting
- Execução com parâmetros customizados
- Categorização automática (data/database)

### 4. Gestão de Usuários
- Criação/edição/remoção de usuários
- Sistema de permissões granular
- Senhas criptografadas
- Auditoria de ações

### 5. Sistema de Logs
- Logs do frontend (localStorage)
- Logs do backend (arquivo + memória)
- Filtros por tipo e data
- Exportação em JSON
- Visualização formatada

### 6. Personalização
- Upload de papel de parede global
- Logo customizado (login + dashboard)
- Favicon personalizado
- Títulos e subtítulos editáveis
- Aplicação em tempo real

## Autenticação e Autorização

### Usuários Padrão
```json
{
  "administrador": "admin123",
  "usuario": "user123"
}
```

### Sistema de Permissões
```json
{
  "date": true/false,        // Configuração de data
  "database": true/false,    // Restauração de banco
  "scripts": true/false,     // Gerenciamento de scripts
  "users": true/false,       // Gestão de usuários
  "logs": true/false         // Visualização de logs
}
```

### Fluxo de Autenticação
1. **Login**: Verificação de credenciais no localStorage
2. **Sessão**: Armazenamento do usuário atual
3. **Permissões**: Carregamento das permissões do usuário
4. **Dashboard**: Renderização baseada nas permissões
5. **Logout**: Limpeza do localStorage

### Níveis de Acesso
- **Administrador**: Todas as permissões sempre ativas
- **Usuário Padrão**: Permissões configuráveis
- **Usuários Customizados**: Permissões definidas pelo admin

## Sistema de Logs

### Tipos de Logs

#### Frontend Logs
- Armazenados no localStorage
- Ações do usuário (login/logout)
- Alterações de configuração
- Limite de 100 entradas

#### Backend Logs
- Armazenados em memória + arquivo
- Execução de scripts
- Upload/download de arquivos
- Erros do sistema
- Formato estruturado JSON

### Estrutura dos Logs
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "INFO|ERROR|WARN|DEBUG",
  "action": "SCRIPT_EXECUTION_SUCCESS",
  "details": {
    "scriptName": "date_config.sh",
    "stdout": "Data alterada com sucesso",
    "stderr": "",
    "exitCode": 0
  },
  "user": "administrador"
}
```

## Personalização

### Recursos Disponíveis
1. **Papel de Parede**: Imagem de fundo global
2. **Logo**: Exibido no login e dashboard
3. **Favicon**: Ícone do navegador
4. **Título Principal**: Nome do sistema
5. **Subtítulo**: Descrição do sistema

### Permissões para Personalização
- **Administradores**: Sempre podem personalizar
- **Usuários com todas as permissões**: Podem personalizar
- **Outros usuários**: Apenas visualizam

### Aplicação das Personalizações
- Salvamento no localStorage
- Eventos de sincronização entre abas
- Aplicação imediata sem refresh
- Persistência entre sessões

## Deploy em Produção

### Pré-requisitos
- Docker Engine 20.10+
- Docker Compose 2.0+
- 2GB RAM mínimo
- 10GB espaço em disco

### Configuração de Produção

#### 1. Preparação do Ambiente
```bash
# Clone do repositório
git clone <repositorio>
cd chrono-shift-control-panel

# Configuração de permissões
sudo chown -R $USER:$USER .
chmod +x scripts/*.sh
```

#### 2. Configuração Docker
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "80:8080"
    environment:
      - NODE_ENV=production
      - VITE_API_URL=http://localhost:3001
    restart: always
    
  backend:
    build:
      context: ./backend
    ports:
      - "3001:3001"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./scripts:/app/scripts
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
    restart: always
    privileged: true
    user: root
```

#### 3. Deploy
```bash
# Build e start dos containers
docker-compose -f docker-compose.prod.yml up -d

# Verificação dos containers
docker-compose ps

# Logs em tempo real
docker-compose logs -f
```

#### 4. Configuração de Reverse Proxy (Nginx)
```nginx
# /etc/nginx/sites-available/chrono-control
server {
    listen 80;
    server_name seu-dominio.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 5. SSL com Let's Encrypt
```bash
# Instalação do Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenção do certificado
sudo certbot --nginx -d seu-dominio.com

# Renovação automática
sudo crontab -e
# Adicionar: 0 2 * * * certbot renew --quiet
```

### Monitoramento em Produção

#### Health Checks
```bash
# Frontend
curl http://localhost:8080

# Backend
curl http://localhost:3001/api/scripts

# Logs do sistema
docker-compose logs --tail=50
```

#### Backup de Dados
```bash
# Scripts e configurações
tar -czf backup-$(date +%Y%m%d).tar.gz scripts/ logs/

# Backup automático (crontab)
0 1 * * * cd /caminho/para/app && tar -czf backups/backup-$(date +\%Y\%m\%d).tar.gz scripts/ logs/
```

### Segurança em Produção

#### Firewall
```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

#### Atualizações
```bash
# Atualização do sistema
sudo apt update && sudo apt upgrade

# Atualização dos containers
docker-compose pull
docker-compose up -d
```

#### Monitoramento de Logs
```bash
# Configuração do logrotate
sudo tee /etc/logrotate.d/chrono-control << EOF
/caminho/para/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    postrotate
        docker-compose restart backend
    endscript
}
EOF
```

## Troubleshooting

### Problemas Comuns

#### 1. Container não inicia
```bash
# Verificar logs
docker-compose logs backend

# Verificar permissões
ls -la /var/run/docker.sock

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
```

#### 2. Scripts não executam
```bash
# Verificar permissões dos scripts
ls -la scripts/

# Corrigir permissões
chmod +x scripts/*.sh

# Verificar se bash está instalado no container
docker-compose exec backend bash --version
```

#### 3. Upload de arquivos falha
```bash
# Verificar espaço em disco
df -h

# Verificar permissões do volume
docker-compose exec backend ls -la /app/scripts
```

#### 4. Interface não carrega
```bash
# Verificar se o frontend está rodando
curl http://localhost:8080

# Verificar logs do frontend
docker-compose logs frontend

# Rebuild do frontend
docker-compose build frontend
```

### Logs de Debug
```bash
# Logs detalhados do backend
docker-compose exec backend tail -f /app/logs/backend.log

# Logs do Docker
journalctl -u docker.service

# Monitoramento de recursos
docker stats
```

### Recuperação de Desastres
1. **Backup de Emergência**: Sempre manter backups recentes
2. **Rollback**: Usar tags de versão para voltar versões estáveis
3. **Reconstrução**: Scripts de automação para rebuild completo
4. **Dados Críticos**: Backup separado de scripts e configurações

## Manutenção

### Rotinas Diárias
- Verificação de logs de erro
- Monitoramento de espaço em disco
- Backup de scripts importantes

### Rotinas Semanais
- Limpeza de logs antigos
- Atualização de dependências
- Verificação de segurança

### Rotinas Mensais
- Backup completo do sistema
- Revisão de usuários e permissões
- Atualização do sistema operacional

---

## Suporte

Para suporte técnico ou dúvidas sobre implementação:
1. Consulte os logs detalhados do sistema
2. Verifique a seção de troubleshooting
3. Documente o problema com logs específicos
4. Utilize os canais de comunicação apropriados

**Versão da Documentação**: 1.0  
**Última Atualização**: 2024-01-01
