
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const { testConnection } = require('./config/database');
const logger = require('./config/logger');

// Importar rotas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const configRoutes = require('./routes/config');
const logRoutes = require('./routes/logs');
const dateActionRoutes = require('./routes/dateActions');
const databaseActionRoutes = require('./routes/databaseActions');
const customizationRoutes = require('./routes/customizations');

const app = express();
const PORT = process.env.PORT || 3001;

// Criar diretórios necessários
const dirs = ['logs', 'uploads', 'temp', 'scripts'];
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logger.info(`Directory created: ${dirPath}`);
  }
});

// Rate limiting mais permissivo
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 1000, // 1000 requisições por minuto
  message: {
    success: false,
    message: 'Muitas requisições, tente novamente mais tarde'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Não aplicar rate limiting para health checks e server-time
    return req.path === '/health' || req.path === '/api/server-time';
  }
});

// Middlewares de segurança
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false // Desabilitar CSP para evitar problemas
}));

// CORS mais permissivo
app.use(cors({
  origin: true, // Permitir qualquer origem
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}));

// Middleware para responder OPTIONS
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

app.use(compression());
app.use(limiter);

// Middlewares de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middleware de logging de requisições (simplificado)
app.use((req, res, next) => {
  // Não fazer log do server-time para evitar spam
  if (req.url !== '/api/server-time') {
    logger.info('Request received', {
      method: req.method,
      url: req.url,
      ip: req.ip
    });
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend online',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV
  });
});

// Server time endpoint (otimizado)
app.get('/api/server-time', (req, res) => {
  res.json({
    success: true,
    serverTime: new Date().toISOString(),
    timezone: 'America/Bahia'
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/config', configRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/date-actions', dateActionRoutes);
app.use('/api/database-actions', databaseActionRoutes);
app.use('/api/customizations', customizationRoutes);

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : err.message
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  logger.warn('Route not found', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });
  
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

// Inicializar servidor
async function startServer() {
  try {
    // Testar conexão com banco
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Falha na conexão com o banco de dados');
    }

    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Servidor rodando na porta ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔗 API Base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('Falha ao iniciar servidor', error);
    process.exit(1);
  }
}

// Tratamento de sinais do sistema
process.on('SIGINT', () => {
  logger.info('SIGINT recebido, encerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM recebido, encerrando servidor...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();
