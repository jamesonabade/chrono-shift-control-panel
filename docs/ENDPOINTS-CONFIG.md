
# Configuração de Endpoints da API

Este documento explica como o sistema detecta e configura automaticamente os endpoints da API em diferentes ambientes.

## 🎯 Detecção Automática de Ambientes

O sistema detecta automaticamente o ambiente baseado na URL de acesso e configura os endpoints adequadamente:

### 1. **Desenvolvimento Local** (fora do Docker)
- **Acesso:** `http://localhost:8080`
- **API:** `http://localhost:3001`
- **Quando usar:** Desenvolvimento local com frontend e backend rodando separadamente

```bash
# Frontend
npm run dev

# Backend (em outro terminal)
cd backend
npm run dev
```

### 2. **Docker Compose** (nginx + containers)
- **Acesso:** `http://localhost` ou `http://localhost:80`
- **API:** `http://localhost/api/*` (proxy via nginx)
- **Quando usar:** Ambiente containerizado local

```bash
docker-compose up --build
```

### 3. **Produção** (domínio personalizado)
- **Acesso:** `https://seu-dominio.com` ou `https://seu-dominio.com/scripts`
- **API:** `https://seu-dominio.com/api/*` ou `https://seu-dominio.com/scripts/api/*`
- **Quando usar:** Deploy em produção

## 🔧 Configuração por Ambiente

### Desenvolvimento Local
```javascript
// Detecção automática quando hostname=localhost e port=8080
{
  baseUrl: 'http://localhost:3001',
  healthUrl: 'http://localhost:3001/api/health',
  environment: 'development'
}
```

### Docker Compose
```javascript
// Detecção automática quando hostname=localhost e port=80
{
  baseUrl: 'http://localhost',
  healthUrl: 'http://localhost/api/health',
  environment: 'docker'
}
```

### Produção
```javascript
// Detecção automática para outros domínios
{
  baseUrl: 'https://seu-dominio.com/scripts',
  healthUrl: 'https://seu-dominio.com/scripts/api/health',
  environment: 'production'
}
```

## 🛠️ Como Usar o Utilitário de Endpoints

### Importar o utilitário
```typescript
import { getApiEndpoint, useApiConfig } from '@/utils/apiEndpoints';
```

### Usar em componentes
```typescript
// Para obter um endpoint específico
const executeUrl = getApiEndpoint('/api/execute-command');

// Para usar de forma reativa (hook)
const { baseUrl, environment, getEndpoint, isProduction } = useApiConfig();

// Exemplo de uso
const response = await fetch(getEndpoint('/api/data'), {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
});
```

## 🐳 Configuração para Produção com Contexto

### Scripts de Build
Os scripts `build-docker-linux.sh` e `build-docker-windows.bat` configuram automaticamente:

1. **Variáveis de ambiente:**
   - `VITE_API_URL`: URL da API
   - `VITE_BASE_PATH`: Caminho base da aplicação
   - `DOMAIN`: Domínio de acesso

2. **Configuração do nginx:**
   - Proxy reverso para API
   - Suporte a subpaths (ex: `/scripts`)
   - Configuração de assets estáticos

### Exemplo de Configuração para Subpath

Para deploy em `https://lab.sigdev.uesb.br/scripts/`:

```bash
# Durante o build
Digite o domínio: lab.sigdev.uesb.br
Digite o caminho base: /scripts
```

Isso gera:
```env
VITE_API_URL=https://lab.sigdev.uesb.br/scripts/api
VITE_BASE_PATH=/scripts
DOMAIN=lab.sigdev.uesb.br
```

## 🔍 Debug e Monitoramento

### Console Logs
O sistema fornece logs detalhados no console:
```
🔍 Detectando ambiente da API:
  Hostname: localhost
  Protocol: http:
  Port: 80
✅ Ambiente: DOCKER COMPOSE
  API Base URL: http://localhost
```

### Interface de Debug
Na seção **Configurações do Sistema**, você pode ver:
- Ambiente detectado
- URL base da API
- URL do health check
- Informações do host atual

## 🚨 Solução de Problemas

### Problema: "Servidor Indisponível"
1. Verificar se o backend está rodando
2. Verificar logs do console para ver qual URL está sendo usada
3. Confirmar se o nginx está fazendo proxy corretamente

### Problema: Endpoints incorretos em produção
1. Verificar se `VITE_BASE_PATH` está configurado corretamente
2. Confirmar configuração do nginx para o subpath
3. Verificar se o build foi feito com as variáveis corretas

### Problema: CORS em desenvolvimento
```bash
# Certificar que o backend está configurado para aceitar CORS do frontend
# No backend/server.js, verificar configuração do CORS
```

## 📋 Checklist de Deploy

- [ ] Configurar domínio e base path nos scripts de build
- [ ] Verificar configuração do nginx para subpaths
- [ ] Testar health check: `https://seu-dominio.com/seu-path/api/health`
- [ ] Verificar logs de debug na interface
- [ ] Testar funcionalidades que fazem chamadas à API

---

**Nota:** O sistema foi projetado para funcionar automaticamente na maioria dos cenários. Se encontrar problemas, verifique os logs de debug na interface de configurações.
