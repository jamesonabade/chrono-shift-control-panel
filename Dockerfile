
FROM node:18-alpine

WORKDIR /app

# Instalar bash para execução dos scripts
RUN apk add --no-cache bash

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Expor porta
EXPOSE 8080

# Comando para iniciar
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080"]
