
FROM node:18-alpine

WORKDIR /app

# Instalar bash e outras dependências
RUN apk add --no-cache bash curl

# Criar diretórios necessários
RUN mkdir -p /app/scripts /app/logs

# Copiar arquivos do backend
COPY package*.json ./
RUN npm install

# Copiar código fonte
COPY . .

# Dar permissões
RUN chmod +x /app/scripts/*.sh 2>/dev/null || true

# Expor porta
EXPOSE 3001

# Comando para iniciar
CMD ["npm", "start"]
