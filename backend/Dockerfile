
FROM docker:25-cli AS docker-cli

FROM node:20-bookworm

# Copiar Docker CLI do estágio anterior
COPY --from=docker-cli /usr/local/bin/docker /usr/local/bin/docker

# Configurar locale e timezone
RUN apt-get update && apt-get install -y \
    locales \
    tzdata \
    bash \
    curl \
    sudo \
    tini \
    dos2unix \
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
ENV NODE_ENV=development

# Executar como root
USER root

WORKDIR /app

# Criar diretórios necessários
RUN mkdir -p /app/scripts /app/logs /app/data

# Copiar arquivos do backend
COPY package*.json ./
RUN npm install

# Copiar código fonte
COPY . .

# Dar permissões completas
RUN chmod -R 755 /app/scripts 2>/dev/null || true && \
    chmod -R 755 /app/logs 2>/dev/null || true && \
    chmod -R 755 /app/data 2>/dev/null || true

# Expor porta
EXPOSE 3001

# Comando de entrada
CMD ["tini", "--", "npm", "start"]
