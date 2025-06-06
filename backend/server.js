
const express = require('express');
const db = require('./database');
const setupMiddleware = require('./middleware');
const { createDirectories } = require('./utils/directories');
const { NODE_ENV, PORT, DATA_DIR, SCRIPTS_DIR, LOGS_DIR, UPLOADS_DIR, BASE_PATH } = require('./config/environment');

// Import routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const configRoutes = require('./routes/config');
const logsRoutes = require('./routes/logs');
const scriptsRoutes = require('./routes/scripts');
const commandsRoutes = require('./routes/commands');

const app = express();

// Setup middleware
setupMiddleware(app);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Testar conexão com banco
    await db.query('SELECT 1');
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      version: '1.0.0',
      database: 'connected',
      basePath: BASE_PATH
    });
  } catch (error) {
    console.error('❌ Health check falhou:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api', configRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api', scriptsRoutes);
app.use('/api', commandsRoutes);

// Middleware de erro global
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  db.logAction('SERVER_ERROR', { error: error.message, stack: error.stack });
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Inicialização
const startServer = async () => {
  try {
    createDirectories();
    
    console.log('🗄️ Inicializando banco de dados...');
    await db.initializeDatabase();
    
    console.log('🚀 Iniciando servidor backend...');
    console.log(`📁 Diretório de dados: ${DATA_DIR}`);
    console.log(`📁 Diretório de scripts: ${SCRIPTS_DIR}`);
    console.log(`📁 Diretório de logs: ${LOGS_DIR}`);
    console.log(`📁 Diretório de uploads: ${UPLOADS_DIR}`);
    console.log(`🌍 Ambiente: ${NODE_ENV}`);
    console.log(`🔗 Base Path: ${BASE_PATH}`);
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Servidor rodando na porta ${PORT}`);
      db.logAction('SERVER_STARTED', { port: PORT, environment: NODE_ENV, basePath: BASE_PATH });
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📤 Recebido SIGTERM, encerrando servidor...');
  await db.logAction('SERVER_SHUTDOWN', { signal: 'SIGTERM' });
  await db.pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📤 Recebido SIGINT, encerrando servidor...');
  await db.logAction('SERVER_SHUTDOWN', { signal: 'SIGINT' });
  await db.pool.end();
  process.exit(0);
});

startServer();
