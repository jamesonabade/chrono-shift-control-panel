
# Sistema de Gerenciamento de Eventos - Docker

Este sistema foi configurado para executar em containers Docker com logging completo e gerenciamento avançado de usuários.

## 🚀 Como executar

### Pré-requisitos
- Docker
- Docker Compose

### Executar com Docker Compose

```bash
# Clone o repositório
git clone <seu-repositorio>
cd <nome-do-projeto>

# Construir e executar
docker-compose up --build

# Executar em background
docker-compose up -d --build
```

O sistema estará disponível em: `http://localhost:8080`

## 📁 Estrutura de Diretórios

```
├── Dockerfile              # Configuração do container
├── docker-compose.yml      # Orquestração dos serviços
├── scripts/                # Scripts bash para execução
├── logs/                   # Logs do sistema
└── src/                    # Código fonte da aplicação
```

## 🔧 Funcionalidades

### 1. **Autenticação Multi-usuário**
- Usuário padrão: `admin` / `admin123`
- Criação de novos usuários
- Alteração de senhas
- Logs de autenticação

### 2. **Configuração de Data**
- Seleção de dia e mês
- Definição automática de variáveis de ambiente:
  - `VARIAVEL_DIA`
  - `VARIAVEL_MES`
- Execução de scripts bash personalizados

### 3. **Restauração de Banco**
- Ambientes: DEV e TESTES
- Variáveis de ambiente:
  - `DB_DEV=true`
  - `DB_TESTES=true`
- Scripts de restauração automáticos

### 4. **Upload de Scripts**
- Scripts de alteração de data
- Scripts de restauração de banco
- Execução segura em ambiente containerizado

### 5. **Sistema de Logs**
- Logs em tempo real
- Rastreamento de todas as ações
- Exportação de logs
- Console logs detalhados

## 📊 Logs do Sistema

O sistema registra automaticamente:

- ✅ Login/Logout de usuários
- ✅ Criação/Exclusão de usuários
- ✅ Alteração de senhas
- ✅ Definição de variáveis de ambiente
- ✅ Execução de scripts
- ✅ Restauração de bancos

### Visualizar logs do Docker

```bash
# Logs da aplicação
docker-compose logs -f event-management

# Logs em tempo real
docker-compose logs -f --tail=50 event-management
```

## 🔒 Segurança

- Autenticação baseada em localStorage
- Logs de tentativas de login
- Isolamento em container Docker
- Scripts executados em ambiente controlado

## 🛠 Comandos Úteis

```bash
# Parar os serviços
docker-compose down

# Rebuild completo
docker-compose down && docker-compose up --build

# Limpar volumes
docker-compose down -v

# Acessar o container
docker-compose exec event-management sh

# Ver status dos containers
docker-compose ps
```

## 📝 Variáveis de Ambiente

O sistema define automaticamente:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `VARIAVEL_DIA` | Dia selecionado | `15` |
| `VARIAVEL_MES` | Mês selecionado | `3` |
| `DB_DEV` | Flag para ambiente DEV | `true` |
| `DB_TESTES` | Flag para ambiente TESTES | `true` |

## 🔄 Scripts Bash

Coloque seus scripts na pasta `/scripts`:

- `date_script.sh` - Script de alteração de data
- `restore_dev.sh` - Script de restauração DEV
- `restore_tests.sh` - Script de restauração TESTES

### Exemplo de script:

```bash
#!/bin/bash
echo "Executando com VARIAVEL_DIA=${VARIAVEL_DIA}"
echo "Executando com VARIAVEL_MES=${VARIAVEL_MES}"
# Seus comandos aqui
```

## 🚨 Troubleshooting

### Container não inicia
```bash
docker-compose logs event-management
```

### Porta já em uso
```bash
# Altere a porta no docker-compose.yml
ports:
  - "3000:8080"  # Use porta 3000 em vez de 8080
```

### Logs não aparecem
```bash
# Verifique se o diretório existe
mkdir -p logs scripts
```

## 📋 TODO

- [ ] Integração com banco de dados PostgreSQL
- [ ] Autenticação JWT
- [ ] API REST para scripts
- [ ] Monitoramento com Prometheus
- [ ] Backup automático de logs

---

**Sistema desenvolvido para gerenciamento futurístico de eventos com Docker! 🐳✨**
