
# Dashboard Sistema

Sistema de dashboard completo com autenticação JWT, gerenciamento de usuários, configurações e logs. Desenvolvido com React + TypeScript no frontend e Node.js + Express + Prisma no backend.

## 🚀 Tecnologias

### Frontend
- **React 18** com TypeScript
- **Vite** como bundler
- **Tailwind CSS** para estilização
- **Shadcn/UI** para componentes
- **Axios** para requisições HTTP
- **React Router** para roteamento

### Backend
- **Node.js** com Express
- **Prisma** como ORM
- **PostgreSQL** como banco de dados
- **JWT** para autenticação
- **bcrypt** para criptografia de senhas
- **Winston** para logs

### Infraestrutura
- **Docker** e **Docker Compose**
- **Nginx** como proxy reverso
- Volumes persistentes para dados

## 📋 Pré-requisitos

- Docker e Docker Compose instalados
- Node.js 18+ (para desenvolvimento local)
- Git

## 🔧 Instalação e Execução

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd dashboard-sistema
```

### 2. Configuração do ambiente

Copie o arquivo `.env` no backend e ajuste as variáveis conforme necessário:

```bash
cp backend/.env.example backend/.env
```

### 3. Iniciar com Docker Compose

```bash
# Construir e iniciar todos os serviços
docker-compose up --build

# Ou em background
docker-compose up -d --build
```

### 4. Acessar o sistema

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Nginx (proxy)**: http://localhost:80

## 👤 Credenciais Padrão

### Administrador
- **E-mail**: admin@dashboard.com
- **Senha**: admin123

### Usuário Comum
- **E-mail**: user@dashboard.com
- **Senha**: user123

## 🗄️ Estrutura do Banco de Dados

O sistema cria automaticamente as seguintes tabelas:

- **users**: Usuários do sistema
- **sessions**: Sessões ativas
- **permissions**: Permissões disponíveis
- **role_permissions**: Relacionamento entre roles e permissões
- **system_configs**: Configurações do sistema
- **system_logs**: Logs de auditoria
- **file_uploads**: Controle de arquivos enviados

## 📁 Estrutura do Projeto

```
├── backend/                    # Backend Node.js
│   ├── src/
│   │   ├── config/            # Configurações (DB, logs)
│   │   ├── controllers/       # Controladores
│   │   ├── middleware/        # Middlewares
│   │   ├── routes/           # Rotas da API
│   │   ├── scripts/          # Scripts de seed
│   │   └── server.js         # Entrada principal
│   ├── prisma/
│   │   └── schema.prisma     # Schema do banco
│   └── Dockerfile
├── src/                       # Frontend React
│   ├── components/           # Componentes React
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilitários
│   └── App.tsx
├── nginx/
│   └── nginx.conf           # Configuração do proxy
├── docker-compose.yml       # Orquestração Docker
└── README.md
```

## 🔐 Sistema de Autenticação

- **JWT tokens** com expiração configurável
- **Senhas criptografadas** com bcrypt
- **Sessões ativas** rastreadas no banco
- **Middleware de autenticação** em todas as rotas protegidas
- **Controle de acesso** baseado em roles (ADMIN/USER)

## 📊 Funcionalidades

### Implementadas
- ✅ Sistema de login/logout
- ✅ Dashboard com estatísticas
- ✅ Autenticação JWT
- ✅ Controle de acesso por roles
- ✅ Logs de auditoria
- ✅ Configurações persistentes
- ✅ Interface responsiva

### Em Desenvolvimento
- 🔄 Gerenciamento completo de usuários
- 🔄 Interface de configurações
- 🔄 Visualização de logs
- 🔄 Métricas e relatórios
- 🔄 Upload de arquivos

## 🔧 Comandos Úteis

### Backend
```bash
# Instalar dependências
cd backend && npm install

# Executar migrações
npm run db:migrate

# Executar seed
npm run db:seed

# Resetar banco
npm run db:reset

# Desenvolvimento
npm run dev
```

### Frontend
```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build para produção
npm run build
```

### Docker
```bash
# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down

# Rebuild
docker-compose up --build

# Executar comando no container
docker-compose exec backend npm run db:seed
```

## 🌐 Ambiente de Produção

Para produção, ajuste:

1. **Variáveis de ambiente** no `.env`
2. **Secrets JWT** seguros
3. **Configuração HTTPS** no Nginx
4. **Backup automático** do banco
5. **Monitoramento** e alertas

## 📝 Logs

Os logs são armazenados:
- **Console**: Durante desenvolvimento
- **Arquivos**: `backend/logs/` (rotação diária)
- **Banco de dados**: Tabela `system_logs`

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

Para suporte, abra uma issue no repositório ou entre em contato através do e-mail de suporte.

---

**Nota**: Este é um ambiente de desenvolvimento que reproduz fielmente o comportamento de produção. Todas as configurações e estruturas foram pensadas para facilitar a manutenção e escalabilidade do sistema.
