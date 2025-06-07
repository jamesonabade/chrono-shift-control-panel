
FROM node:18-bookworm

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Configurar diretório de trabalho
WORKDIR /app

# Copiar apenas package.json primeiro
COPY package.json ./
COPY prisma ./prisma/

# Limpar cache npm e instalar dependências (incluindo devDependencies para desenvolvimento)
RUN npm cache clean --force && \
    npm install

# Gerar cliente Prisma
RUN npx prisma generate

# Copiar código fonte
COPY src ./src

# Criar diretórios necessários
RUN mkdir -p logs uploads temp

# Criar usuário não-root
RUN addgroup --gid 1001 nodejs
RUN adduser --system --uid 1001 backend

# Dar permissões ao usuário
RUN chown -R backend:nodejs /app
USER backend

# Expor porta
EXPOSE 3001

# Comando de inicialização
CMD ["npm", "start"]
