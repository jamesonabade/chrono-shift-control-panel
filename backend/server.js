
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Configurações de ambiente
const NODE_ENV = process.env.NODE_ENV || 'development';
const DATA_DIR = process.env.DATA_DIR || '/app/data';
const SCRIPTS_DIR = process.env.SCRIPTS_DIR || '/app/scripts';
const LOGS_DIR = process.env.LOGS_DIR || '/app/logs';
const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads';
const BASE_PATH = process.env.BASE_PATH || '';

// Criar diretórios necessários
const createDirectories = () => {
  const dirs = [DATA_DIR, SCRIPTS_DIR, LOGS_DIR, UPLOADS_DIR];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Diretório criado: ${dir}`);
    }
  });
};

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir uploads estáticos
app.use('/uploads', express.static(UPLOADS_DIR));

// Configuração do multer para uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// === ENDPOINTS DE CONFIGURAÇÃO ===

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

// Autenticação
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username e senha são obrigatórios' });
    }
    
    const user = await db.getUser(username);
    
    if (!user || user.password !== password) {
      await db.logAction('LOGIN_FAILED', { username }, username, req.ip);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    await db.logAction('LOGIN_SUCCESS', { username }, username, req.ip);
    
    res.json({ 
      success: true, 
      user: username,
      permissions: user.permissions || {}
    });
  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Gerenciar usuários
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('❌ Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro ao carregar usuários' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, password, permissions } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username e senha são obrigatórios' });
    }
    
    // Verificar se usuário já existe
    const existingUser = await db.getUser(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }
    
    await db.createUser(username, password, permissions || {});
    await db.logAction('USER_CREATED', { username }, req.headers['x-user'] || 'system');
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

app.put('/api/users/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { password, permissions } = req.body;
    
    const updates = {};
    if (password) updates.password = password;
    if (permissions) updates.permissions = permissions;
    
    const success = await db.updateUser(username, updates);
    if (!success) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    await db.logAction('USER_UPDATED', { username, updates: Object.keys(updates) }, req.headers['x-user'] || 'system');
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

app.delete('/api/users/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    if (username === 'administrador') {
      return res.status(400).json({ error: 'Não é possível remover o administrador' });
    }
    
    const success = await db.deleteUser(username);
    if (!success) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    await db.logAction('USER_DELETED', { username }, req.headers['x-user'] || 'system');
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao deletar usuário:', error);
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});

// Personalizações
app.get('/api/customizations', async (req, res) => {
  try {
    const customizations = await db.getConfig('customizations');
    res.json(customizations || {
      background: '',
      logo: '',
      favicon: '',
      title: 'PAINEL DE CONTROLE',
      subtitle: 'Sistema de Gerenciamento Docker'
    });
  } catch (error) {
    console.error('❌ Erro ao buscar personalizações:', error);
    res.status(500).json({ error: 'Erro ao carregar personalizações' });
  }
});

app.post('/api/customizations', async (req, res) => {
  try {
    const customizations = req.body;
    
    await db.setConfig('customizations', customizations);
    await db.logAction('CUSTOMIZATIONS_UPDATED', customizations, req.headers['x-user'] || 'system');
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao salvar personalizações:', error);
    res.status(500).json({ error: 'Erro ao salvar personalizações' });
  }
});

// Variáveis do sistema
app.get('/api/system-variables', async (req, res) => {
  try {
    const variables = await db.getConfig('systemVariables');
    res.json(variables || {});
  } catch (error) {
    console.error('❌ Erro ao buscar variáveis:', error);
    res.status(500).json({ error: 'Erro ao carregar variáveis' });
  }
});

app.post('/api/system-variables', async (req, res) => {
  try {
    const variables = req.body;
    
    await db.setConfig('systemVariables', variables);
    await db.logAction('SYSTEM_VARIABLES_UPDATED', variables, req.headers['x-user'] || 'system');
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao salvar variáveis:', error);
    res.status(500).json({ error: 'Erro ao salvar variáveis' });
  }
});

// Logs do sistema
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await db.getLogs(100);
    res.json(logs);
  } catch (error) {
    console.error('❌ Erro ao buscar logs:', error);
    res.status(500).json({ error: 'Erro ao carregar logs' });
  }
});

// Upload de scripts
app.post('/api/upload-script', upload.single('script'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }
  
  const scriptPath = path.join(SCRIPTS_DIR, req.file.originalname);
  
  try {
    fs.copyFileSync(req.file.path, scriptPath);
    fs.unlinkSync(req.file.path); // Remove arquivo temporário
    
    // Dar permissão de execução
    try {
      execSync(`chmod +x "${scriptPath}"`);
    } catch (chmodError) {
      console.warn('Aviso: Não foi possível definir permissão de execução:', chmodError.message);
    }
    
    await db.logAction('SCRIPT_UPLOADED', { filename: req.file.originalname }, req.headers['x-user'] || 'system');
    
    res.json({ 
      success: true, 
      filename: req.file.originalname,
      path: scriptPath
    });
  } catch (error) {
    console.error('Erro ao salvar script:', error);
    res.status(500).json({ error: 'Erro ao salvar script' });
  }
});

// Listar scripts
app.get('/api/scripts', async (req, res) => {
  try {
    if (!fs.existsSync(SCRIPTS_DIR)) {
      return res.json([]);
    }
    
    const files = fs.readdirSync(SCRIPTS_DIR);
    const scripts = files.map(file => {
      const filePath = path.join(SCRIPTS_DIR, file);
      const stats = fs.statSync(filePath);
      
      return {
        name: file,
        size: stats.size,
        modified: stats.mtime,
        executable: !!(stats.mode & parseInt('111', 8))
      };
    });
    
    res.json(scripts);
  } catch (error) {
    console.error('Erro ao listar scripts:', error);
    res.status(500).json({ error: 'Erro ao listar scripts' });
  }
});

// Executar comando/script
app.post('/api/execute-command', async (req, res) => {
  const { command, type } = req.body;
  
  if (!command) {
    return res.status(400).json({ error: 'Comando não fornecido' });
  }
  
  try {
    let fullCommand = command;
    
    if (type === 'script') {
      const scriptPath = path.join(SCRIPTS_DIR, command);
      if (!fs.existsSync(scriptPath)) {
        return res.status(404).json({ error: 'Script não encontrado' });
      }
      fullCommand = `bash "${scriptPath}"`;
    }
    
    const result = execSync(fullCommand, { 
      timeout: 300000, // 5 minutos
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10 // 10MB
    });
    
    await db.logAction('COMMAND_EXECUTED', { command: fullCommand, type }, req.headers['x-user'] || 'system');
    
    res.json({ 
      success: true, 
      output: result,
      command: fullCommand
    });
  } catch (error) {
    await db.logAction('COMMAND_FAILED', { command, error: error.message }, req.headers['x-user'] || 'system');
    
    res.status(500).json({ 
      error: error.message,
      output: error.stdout || '',
      stderr: error.stderr || ''
    });
  }
});

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
