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
app.use(express.json());

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
    
    // Criar arquivo .env com as variáveis
    const envFile = '/app/scripts/.env';
    let envContent = '';
    Object.entries(environment).forEach(([key, value]) => {
      envContent += `export ${key}="${value}"\n`;
    });
    
    fs.writeFileSync(envFile, envContent);
    
    const logFile = `/app/logs/execution_${Date.now()}.log`;
    const command = `cd /app/scripts && source .env && bash ${scriptName}`;
    
    logAction('info', 'SCRIPT_EXECUTION_START', {
      scriptName,
      action,
      environment,
      command
    });
    
    exec(command, { 
      cwd: '/app/scripts',
      env: { ...process.env, ...environment }
    }, (error, stdout, stderr) => {
      const logContent = `
Execution Time: ${new Date().toISOString()}
Action: ${action}
Script: ${scriptName}
Command: ${command}
Environment Variables: ${JSON.stringify(environment, null, 2)}
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
        logAction('error', 'SCRIPT_EXECUTION_ERROR', {
          scriptName,
          action,
          error: error.message,
          exitCode: error.code,
          logFile
        });
        
        res.status(500).json({
          success: false,
          error: error.message,
          stderr,
          logFile,
          exitCode: error.code
        });
      } else {
        logAction('info', 'SCRIPT_EXECUTION_SUCCESS', {
          scriptName,
          action,
          stdout,
          logFile
        });
        
        res.json({
          success: true,
          output: stdout,
          stderr,
          logFile,
          message: `${action} executado com sucesso`
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

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  logAction('info', 'SERVER_STARTED', { port: PORT, timestamp: new Date().toISOString() });
  
  // Criar diretórios necessários
  const dirs = ['/app/scripts', '/app/logs'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logAction('info', 'DIRECTORY_CREATED', { path: dir });
    }
  });
});
