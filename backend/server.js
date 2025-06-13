const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Array para armazenar logs em memória
let backendLogs = [];

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend está funcionando',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Configuração do multer para upload de scripts
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = '/app/scripts';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// Função para logging melhorada
const logAction = (level, action, details) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    action,
    details,
    message: `[${level.toUpperCase()}] ${action}: ${typeof details === 'string' ? details : JSON.stringify(details)}`
  };
  
  // Adicionar ao array de logs em memória
  backendLogs.push(logEntry);
  
  // Manter apenas os últimos 100 logs
  if (backendLogs.length > 100) {
    backendLogs = backendLogs.slice(-100);
  }
  
  console.log(`[${level.toUpperCase()}] ${action}:`, details);
  
  // Salvar em arquivo também
  const logFile = '/app/logs/backend.log';
  const logLine = `${logEntry.timestamp} - [${level.toUpperCase()}] ${action}: ${JSON.stringify(details)}\n`;
  
  fs.appendFile(logFile, logLine, (err) => {
    if (err) console.error('Erro ao escrever log:', err);
  });
};

// Nova rota para obter logs do backend
app.get('/api/backend-logs', (req, res) => {
  try {
    res.json(backendLogs.slice().reverse()); // Retorna logs mais recentes primeiro
  } catch (error) {
    logAction('error', 'GET_BACKEND_LOGS_ERROR', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Nova rota para salvar script editado
app.post('/api/save-script', express.text({ type: 'text/plain' }), (req, res) => {
  try {
    const { filename, type } = req.query;
    const content = req.body;
    
    if (!filename) {
      return res.status(400).json({ success: false, error: 'Nome do arquivo é obrigatório' });
    }
    
    const filePath = path.join('/app/scripts', filename);
    
    fs.writeFileSync(filePath, content);
    fs.chmodSync(filePath, '755');
    
    logAction('info', 'SCRIPT_SAVED', {
      fileName: filename,
      type,
      path: filePath,
      size: content.length
    });
    
    res.json({
      success: true,
      fileName: filename,
      type,
      path: filePath,
      size: content.length
    });
  } catch (error) {
    logAction('error', 'SCRIPT_SAVE_ERROR', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Nova rota para preview de script
app.get('/api/preview-script/:filename', (req, res) => {
  try {
    const fileName = req.params.filename;
    const filePath = path.join('/app/scripts', fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Arquivo não encontrado' });
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    logAction('info', 'SCRIPT_PREVIEW', { fileName });
    
    res.json({ success: true, content, fileName });
  } catch (error) {
    logAction('error', 'SCRIPT_PREVIEW_ERROR', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Definir variáveis de ambiente
app.post('/api/set-env', (req, res) => {
  try {
    const envVars = req.body;
    const envFile = '/app/scripts/.env';
    
    let envContent = '';
    Object.entries(envVars).forEach(([key, value]) => {
      process.env[key] = value;
      envContent += `export ${key}="${value}"\n`;
    });
    
    fs.writeFileSync(envFile, envContent);
    
    logAction('info', 'SET_ENV_VARIABLES', { variables: envVars, envFile });
    
    res.json({ success: true, envFile, variables: envVars });
  } catch (error) {
    logAction('error', 'SET_ENV_ERROR', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload de script
app.post('/api/upload-script', upload.single('script'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado' });
    }

    const { type } = req.body;
    const fileName = req.file.filename;
    const filePath = req.file.path;
    
    // Dar permissão de execução
    fs.chmodSync(filePath, '755');
    
    logAction('info', 'SCRIPT_UPLOADED', {
      fileName,
      type,
      path: filePath,
      size: req.file.size
    });
    
    res.json({
      success: true,
      fileName,
      type,
      path: filePath,
      size: req.file.size
    });
  } catch (error) {
    logAction('error', 'SCRIPT_UPLOAD_ERROR', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Listar scripts
app.get('/api/scripts', (req, res) => {
  try {
    const scriptsDir = '/app/scripts';
    
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true });
    }
    
    const files = fs.readdirSync(scriptsDir);
    const scripts = files
      .filter(file => file.endsWith('.sh') || file.endsWith('.bash'))
      .map(file => {
        const filePath = path.join(scriptsDir, file);
        const stats = fs.statSync(filePath);
        
        // Determinar tipo baseado no nome do arquivo
        let type = 'unknown';
        if (file.toLowerCase().includes('date') || file.toLowerCase().includes('data')) {
          type = 'date';
        } else if (file.toLowerCase().includes('database') || file.toLowerCase().includes('banco') || file.toLowerCase().includes('db')) {
          type = 'database';
        }
        
        return {
          name: file,
          type,
          size: stats.size,
          uploadDate: stats.mtime.toISOString()
        };
      });
    
    res.json(scripts);
  } catch (error) {
    logAction('error', 'LIST_SCRIPTS_ERROR', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Download de script
app.get('/api/download-script/:filename', (req, res) => {
  try {
    const fileName = req.params.filename;
    const filePath = path.join('/app/scripts', fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Arquivo não encontrado' });
    }
    
    logAction('info', 'SCRIPT_DOWNLOADED', { fileName });
    
    res.download(filePath, fileName);
  } catch (error) {
    logAction('error', 'SCRIPT_DOWNLOAD_ERROR', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Deletar script
app.delete('/api/delete-script/:filename', (req, res) => {
  try {
    const fileName = req.params.filename;
    const filePath = path.join('/app/scripts', fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Arquivo não encontrado' });
    }
    
    fs.unlinkSync(filePath);
    
    logAction('info', 'SCRIPT_DELETED', { fileName });
    
    res.json({ success: true, message: 'Script removido com sucesso' });
  } catch (error) {
    logAction('error', 'SCRIPT_DELETE_ERROR', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Executar script com variáveis de ambiente
app.post('/api/execute-script', (req, res) => {
  try {
    const { scriptName, environment = {}, action } = req.body;
    const scriptPath = path.join('/app/scripts', scriptName);
    
    if (!fs.existsSync(scriptPath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'Script não encontrado',
        message: 'O script necessário não foi carregado. Por favor, faça o upload do script antes de executar esta ação.'
      });
    }
    
    // Criar arquivo .env com as variáveis de forma mais robusta
    const envFile = '/app/scripts/.env';
    let envContent = '#!/bin/bash\n';
    
    // Adicionar variáveis uma por uma com export
    Object.entries(environment).forEach(([key, value]) => {
      envContent += `export ${key}="${value}"\n`;
      // Também definir no processo atual
      process.env[key] = value;
    });
    
    fs.writeFileSync(envFile, envContent);
    fs.chmodSync(envFile, '755');
    
    const logFile = `/app/logs/execution_${Date.now()}.log`;
    
    // Comando melhorado para garantir que as variáveis sejam carregadas
    const command = `cd /app/scripts && source .env && bash ${scriptName}`;
    
    logAction('info', 'SCRIPT_EXECUTION_START', {
      scriptName,
      action,
      environment,
      command,
      user: 'root',
      envFile,
      envContent
    });
    
    exec(command, { 
      cwd: '/app/scripts',
      env: { ...process.env, ...environment },
      uid: 0,
      gid: 0,
      shell: '/bin/bash'
    }, (error, stdout, stderr) => {
      const logContent = `
Execution Time: ${new Date().toISOString()}
Action: ${action}
Script: ${scriptName}
Command: ${command}
User: root
Environment Variables: ${JSON.stringify(environment, null, 2)}
Exit Code: ${error ? error.code || 1 : 0}

ENV FILE CONTENT:
${envContent}

STDOUT:
${stdout}

STDERR:
${stderr}

ERROR:
${error ? error.message : 'None'}
      `.trim();
      
      fs.writeFileSync(logFile, logContent);
      
      if (error) {
        logAction('error', 'SCRIPT_EXECUTION_ERROR', {
          scriptName,
          action,
          error: error.message,
          exitCode: error.code,
          logFile,
          stdout,
          stderr,
          environment,
          envContent
        });
        
        res.status(500).json({
          success: false,
          error: error.message,
          stderr,
          stdout,
          logFile,
          exitCode: error.code,
          environment,
          envContent
        });
      } else {
        logAction('info', 'SCRIPT_EXECUTION_SUCCESS', {
          scriptName,
          action,
          stdout,
          stderr,
          logFile,
          environment,
          envContent
        });
        
        res.json({
          success: true,
          output: stdout,
          stderr,
          logFile,
          message: `${action} executado com sucesso`,
          environment,
          envContent
        });
      }
    });
    
  } catch (error) {
    logAction('error', 'SCRIPT_EXECUTION_SETUP_ERROR', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verificar se script existe
app.get('/api/check-script/:type', (req, res) => {
  try {
    const type = req.params.type;
    const scriptsDir = '/app/scripts';
    
    if (!fs.existsSync(scriptsDir)) {
      return res.json({ exists: false, script: null });
    }
    
    const files = fs.readdirSync(scriptsDir);
    const script = files.find(file => {
      const fileName = file.toLowerCase();
      if (type === 'date') {
        return fileName.includes('date') || fileName.includes('data');
      } else if (type === 'database') {
        return fileName.includes('database') || fileName.includes('banco') || fileName.includes('db');
      }
      return false;
    });
    
    res.json({ 
      exists: !!script, 
      script: script || null,
      type 
    });
  } catch (error) {
    logAction('error', 'CHECK_SCRIPT_ERROR', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Nova rota para executar comandos personalizados
app.post('/api/execute-command', (req, res) => {
  try {
    const { command, name, description, environment = {} } = req.body;
    
    if (!command) {
      return res.status(400).json({ 
        success: false, 
        error: 'Comando é obrigatório',
        endpoint: `http://localhost:3001/api/execute-command`
      });
    }

    const logFile = `/app/logs/command_${Date.now()}.log`;
    
    logAction('info', 'COMMAND_EXECUTION_START', {
      command,
      name: name || 'Comando personalizado',
      description,
      environment,
      user: 'system',
      endpoint: `http://localhost:3001/api/execute-command`
    });
    
    // Preparar variáveis de ambiente
    const execEnv = { ...process.env, ...environment };
    
    exec(command, { 
      cwd: '/app',
      env: execEnv,
      uid: 0,
      gid: 0,
      shell: '/bin/bash'
    }, (error, stdout, stderr) => {
      const logContent = `
Execution Time: ${new Date().toISOString()}
Command: ${command}
Name: ${name || 'Comando personalizado'}
Description: ${description || 'N/A'}
User: system
Environment: ${JSON.stringify(environment, null, 2)}
Exit Code: ${error ? error.code || 1 : 0}

STDOUT:
${stdout}

STDERR:
${stderr}

ERROR:
${error ? error.message : 'None'}
      `.trim();
      
      fs.writeFileSync(logFile, logContent);
      
      if (error) {
        logAction('error', 'COMMAND_EXECUTION_ERROR', {
          command,
          name,
          error: error.message,
          exitCode: error.code,
          logFile,
          stdout,
          stderr,
          environment,
          endpoint: `http://localhost:3001/api/execute-command`
        });
        
        res.status(500).json({
          success: false,
          error: `${error.message} (Endpoint: http://localhost:3001/api/execute-command)`,
          stderr,
          stdout,
          logFile,
          exitCode: error.code,
          environment,
          endpoint: `http://localhost:3001/api/execute-command`
        });
      } else {
        logAction('info', 'COMMAND_EXECUTION_SUCCESS', {
          command,
          name,
          stdout,
          stderr,
          logFile,
          environment,
          endpoint: `http://localhost:3001/api/execute-command`
        });
        
        res.json({
          success: true,
          output: stdout,
          stderr,
          logFile,
          message: `${name || 'Comando'} executado com sucesso`,
          environment,
          endpoint: `http://localhost:3001/api/execute-command`
        });
      }
    });
    
  } catch (error) {
    logAction('error', 'COMMAND_EXECUTION_SETUP_ERROR', { 
      error: error.message,
      endpoint: `http://localhost:3001/api/execute-command`
    });
    res.status(500).json({ 
      success: false, 
      error: `${error.message} (Endpoint: http://localhost:3001/api/execute-command)`,
      endpoint: `http://localhost:3001/api/execute-command`
    });
  }
});

// Nova rota para salvar personalizações
app.post('/api/customizations', (req, res) => {
  try {
    const customizations = req.body;
    const customizationsFile = '/app/data/customizations.json';
    
    // Criar diretório se não existir
    const dataDir = '/app/data';
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(customizationsFile, JSON.stringify(customizations, null, 2));
    
    logAction('info', 'CUSTOMIZATIONS_SAVED', { customizations });
    
    res.json({ success: true, message: 'Personalizações salvas com sucesso' });
  } catch (error) {
    logAction('error', 'CUSTOMIZATIONS_SAVE_ERROR', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Nova rota para carregar personalizações
app.get('/api/customizations', (req, res) => {
  try {
    const customizationsFile = '/app/data/customizations.json';
    
    if (fs.existsSync(customizationsFile)) {
      const customizations = JSON.parse(fs.readFileSync(customizationsFile, 'utf8'));
      res.json(customizations);
    } else {
      res.json({
        background: '',
        logo: '',
        favicon: '',
        title: 'PAINEL DE CONTROLE',
        subtitle: 'Sistema de Gerenciamento Docker'
      });
    }
  } catch (error) {
    logAction('error', 'CUSTOMIZATIONS_LOAD_ERROR', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Nova rota para salvar variáveis do sistema
app.post('/api/system-variables', (req, res) => {
  try {
    const variables = req.body;
    const variablesFile = '/app/data/system-variables.json';
    
    // Criar diretório se não existir
    const dataDir = '/app/data';
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(variablesFile, JSON.stringify(variables, null, 2));
    
    logAction('info', 'SYSTEM_VARIABLES_SAVED', { variables });
    
    res.json({ success: true, message: 'Variáveis do sistema salvas com sucesso' });
  } catch (error) {
    logAction('error', 'SYSTEM_VARIABLES_SAVE_ERROR', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Nova rota para carregar variáveis do sistema
app.get('/api/system-variables', (req, res) => {
  try {
    const variablesFile = '/app/data/system-variables.json';
    
    if (fs.existsSync(variablesFile)) {
      const variables = JSON.parse(fs.readFileSync(variablesFile, 'utf8'));
      res.json(variables);
    } else {
      res.json({
        date: {},
        database: {}
      });
    }
  } catch (error) {
    logAction('error', 'SYSTEM_VARIABLES_LOAD_ERROR', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Atualizar middleware de erro para incluir informações de endpoint mais detalhadas
app.use((err, req, res, next) => {
  const endpoint = `http://localhost:3001${req.path}`;
  const errorMessage = `${err.message} (Falha ao conectar em: ${endpoint})`;
  
  logAction('error', 'SERVER_ERROR', { 
    error: errorMessage, 
    path: req.path,
    method: req.method,
    endpoint,
    stack: err.stack,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  res.status(500).json({ 
    success: false, 
    error: errorMessage,
    endpoint,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  logAction('info', 'SERVER_STARTED', { 
    port: PORT, 
    timestamp: new Date().toISOString(),
    endpoints: {
      health: `http://localhost:${PORT}/api/health`,
      customizations: `http://localhost:${PORT}/api/customizations`,
      executeCommand: `http://localhost:${PORT}/api/execute-command`,
      scripts: `http://localhost:${PORT}/api/scripts`,
      backendLogs: `http://localhost:${PORT}/api/backend-logs`
    }
  });
  
  // Criar diretórios necessários
  const dirs = ['/app/scripts', '/app/logs', '/app/data'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logAction('info', 'DIRECTORY_CREATED', { path: dir });
    }
  });
});
