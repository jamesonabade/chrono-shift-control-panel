
FROM node:18-alpine

WORKDIR /app

# Instalar bash para execução dos scripts
RUN apk add --no-cache bash curl

# Criar diretórios necessários
RUN mkdir -p /app/scripts /app/logs /app/data

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Dar permissões aos scripts
RUN chmod +x /app/scripts/*.sh 2>/dev/null || true

# Expor porta
EXPOSE 8080

# Comando para iniciar
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080"]
