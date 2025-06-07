
FROM node:18-bookworm

# Configurar locale e timezone
RUN apt-get update && apt-get install -y \
    locales \
    tzdata \
    bash \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Configurar locale para pt_BR.UTF-8
RUN sed -i '/^#.* pt_BR.UTF-8 /s/^#//' /etc/locale.gen && \
    locale-gen && \
    echo "LANG=pt_BR.UTF-8" > /etc/default/locale

# Configurar timezone para America/Bahia
RUN ln -fs /usr/share/zoneinfo/America/Bahia /etc/localtime && \
    echo "America/Bahia" > /etc/timezone && \
    dpkg-reconfigure -f noninteractive tzdata

# Definir variáveis de ambiente
ENV LANG=pt_BR.UTF-8
ENV LC_ALL=pt_BR.UTF-8
ENV TZ=America/Bahia

WORKDIR /app

# Criar diretórios necessários
RUN mkdir -p /app/scripts /app/logs /app/data

# Copiar apenas package.json primeiro
COPY package.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte (excluindo node_modules via .dockerignore)
COPY . .

# Dar permissões aos scripts
RUN chmod +x /app/scripts/*.sh 2>/dev/null || true
RUN chmod -R 755 /app/scripts 2>/dev/null || true
RUN chmod -R 755 /app/logs 2>/dev/null || true
RUN chmod -R 755 /app/data 2>/dev/null || true

# Expor porta
EXPOSE 8080

# Comando para desenvolvimento
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080"]
