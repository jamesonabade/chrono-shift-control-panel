
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3001;

// Configurações de ambiente
const NODE_ENV = process.env.NODE_ENV || 'development';
const DATA_DIR = process.env.DATA_DIR || '/app/data';
const SCRIPTS_DIR = process.env.SCRIPTS_DIR || '/app/scripts';
const LOGS_DIR = process.env.LOGS_DIR || '/app/logs';
const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads';

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

// Inicializar configurações padrão
const initializeDefaultConfig = () => {
  const configFile = path.join(DATA_DIR, 'system-config.json');
  
  if (!fs.existsSync(configFile)) {
    const defaultConfig = {
      users: {
        'administrador': 'admin123',
        'usuario': 'user123'
      },
      permissions: {
        'usuario': {
          date: true,
          database: false,
          scripts: true,
          users: false,
          logs: true
        }
      },
      customizations: {
        background: '',
        logo: '',
        favicon: '',
        title: 'PAINEL DE CONTROLE',
        subtitle: 'Sistema de Gerenciamento Docker'
      },
      systemVariables: {},
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, 2));
    console.log('✅ Configuração padrão criada');
  }
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

// Utilitários para gerenciar configurações
const getConfig = () => {
  const configFile = path.join(DATA_DIR, 'system-config.json');
  if (fs.existsSync(configFile)) {
    return JSON.parse(fs.readFileSync(configFile, 'utf8'));
  }
  return null;
};

const saveConfig = (config) => {
  const configFile = path.join(DATA_DIR, 'system-config.json');
  config.lastUpdated = new Date().toISOString();
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
};

// Logs centralizados
const logAction = (action, details, user = 'system') => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    details,
    user
  };
  
  const logsFile = path.join(LOGS_DIR, 'system-logs.json');
  let logs = [];
  
  if (fs.existsSync(logsFile)) {
    try {
      logs = JSON.parse(fs.readFileSync(logsFile, 'utf8'));
    } catch (error) {
      console.error('Erro ao ler logs:', error);
    }
  }
  
  logs.push(logEntry);
  logs = logs.slice(-1000); // Manter apenas últimos 1000 logs
  
  fs.writeFileSync(logsFile, JSON.stringify(logs, null, 2));
};

// === ENDPOINTS DE CONFIGURAÇÃO ===

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: '1.0.0'
  });
});

// Autenticação
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const config = getConfig();
  
  if (!config || !config.users[username] || config.users[username] !== password) {
    logAction('LOGIN_FAILED', { username, ip: req.ip });
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  
  logAction('LOGIN_SUCCESS', { username, ip: req.ip }, username);
  
  res.json({ 
    success: true, 
    user: username,
    permissions: config.permissions[username] || {}
  });
});

// Gerenciar usuários
app.get('/api/users', (req, res) => {
  const config = getConfig();
  if (!config) return res.status(500).json({ error: 'Configuração não encontrada' });
  
  const users = Object.keys(config.users).map(username => ({
    username,
    permissions: config.permissions[username] || {}
  }));
  
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const { username, password, permissions } = req.body;
  const config = getConfig();
  
  if (!config) return res.status(500).json({ error: 'Configuração não encontrada' });
  
  config.users[username] = password;
  if (permissions) {
    config.permissions[username] = permissions;
  }
  
  saveConfig(config);
  logAction('USER_CREATED', { username }, req.headers['x-user'] || 'system');
  
  res.json({ success: true });
});

app.delete('/api/users/:username', (req, res) => {
  const { username } = req.params;
  const config = getConfig();
  
  if (!config) return res.status(500).json({ error: 'Configuração não encontrada' });
  
  delete config.users[username];
  delete config.permissions[username];
  
  saveConfig(config);
  logAction('USER_DELETED', { username }, req.headers['x-user'] || 'system');
  
  res.json({ success: true });
});

// Personalizações
app.get('/api/customizations', (req, res) => {
  const config = getConfig();
  if (!config) return res.status(500).json({ error: 'Configuração não encontrada' });
  
  res.json(config.customizations || {});
});

app.post('/api/customizations', (req, res) => {
  const customizations = req.body;
  const config = getConfig();
  
  if (!config) return res.status(500).json({ error: 'Configuração não encontrada' });
  
  config.customizations = { ...config.customizations, ...customizations };
  saveConfig(config);
  
  logAction('CUSTOMIZATIONS_UPDATED', customizations, req.headers['x-user'] || 'system');
  
  res.json({ success: true });
});

// Variáveis do sistema
app.get('/api/system-variables', (req, res) => {
  const config = getConfig();
  if (!config) return res.status(500).json({ error: 'Configuração não encontrada' });
  
  res.json(config.systemVariables || {});
});

app.post('/api/system-variables', (req, res) => {
  const variables = req.body;
  const config = getConfig();
  
  if (!config) return res.status(500).json({ error: 'Configuração não encontrada' });
  
  config.systemVariables = variables;
  saveConfig(config);
  
  logAction('SYSTEM_VARIABLES_UPDATED', variables, req.headers['x-user'] || 'system');
  
  res.json({ success: true });
});

// Logs do sistema
app.get('/api/logs', (req, res) => {
  const logsFile = path.join(LOGS_DIR, 'system-logs.json');
  
  if (!fs.existsSync(logsFile)) {
    return res.json([]);
  }
  
  try {
    const logs = JSON.parse(fs.readFileSync(logsFile, 'utf8'));
    res.json(logs.slice(-100)); // Últimos 100 logs
  } catch (error) {
    console.error('Erro ao ler logs:', error);
    res.status(500).json({ error: 'Erro ao carregar logs' });
  }
});

// Upload de scripts
app.post('/api/upload-script', upload.single('script'), (req, res) => {
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
    
    logAction('SCRIPT_UPLOADED', { filename: req.file.originalname }, req.headers['x-user'] || 'system');
    
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
app.get('/api/scripts', (req, res) => {
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
app.post('/api/execute-command', (req, res) => {
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
    
    logAction('COMMAND_EXECUTED', { command: fullCommand, type }, req.headers['x-user'] || 'system');
    
    res.json({ 
      success: true, 
      output: result,
      command: fullCommand
    });
  } catch (error) {
    logAction('COMMAND_FAILED', { command, error: error.message }, req.headers['x-user'] || 'system');
    
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
  logAction('SERVER_ERROR', { error: error.message, stack: error.stack });
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Inicialização
const startServer = () => {
  createDirectories();
  initializeDefaultConfig();
  
  console.log('🚀 Iniciando servidor backend...');
  console.log(`📁 Diretório de dados: ${DATA_DIR}`);
  console.log(`📁 Diretório de scripts: ${SCRIPTS_DIR}`);
  console.log(`📁 Diretório de logs: ${LOGS_DIR}`);
  console.log(`📁 Diretório de uploads: ${UPLOADS_DIR}`);
  console.log(`🌍 Ambiente: ${NODE_ENV}`);
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
    logAction('SERVER_STARTED', { port: PORT, environment: NODE_ENV });
  });
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📤 Recebido SIGTERM, encerrando servidor...');
  logAction('SERVER_SHUTDOWN', { signal: 'SIGTERM' });
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📤 Recebido SIGINT, encerrando servidor...');
  logAction('SERVER_SHUTDOWN', { signal: 'SIGINT' });
  process.exit(0);
});

startServer();
