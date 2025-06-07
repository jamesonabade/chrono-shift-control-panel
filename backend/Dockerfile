
FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache openssl

# Configurar diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm install --omit=dev

# Gerar cliente Prisma
RUN npx prisma generate

# Copiar código fonte
COPY src ./src

# Criar diretórios necessários
RUN mkdir -p logs uploads temp

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

# Dar permissões ao usuário
RUN chown -R backend:nodejs /app
USER backend

# Expor porta
EXPOSE 3001

# Comando de inicialização
CMD ["npm", "start"]
