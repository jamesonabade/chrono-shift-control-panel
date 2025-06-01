
FROM node:18-alpine

# Executar como root
USER root

WORKDIR /app

# Instalar bash e outras dependências
RUN apk add --no-cache bash curl sudo

# Criar diretórios necessários
RUN mkdir -p /app/scripts /app/logs

# Copiar arquivos do backend
COPY package*.json ./
RUN npm install

# Copiar código fonte
COPY . .

# Dar permissões completas
RUN chmod -R 755 /app/scripts 2>/dev/null || true
RUN chmod -R 755 /app/logs 2>/dev/null || true

# Expor porta
EXPOSE 3001

# Comando para iniciar como root
CMD ["npm", "start"]
