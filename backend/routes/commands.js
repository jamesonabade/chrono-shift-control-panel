
const express = require('express');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const db = require('../database');
const { SCRIPTS_DIR } = require('../config/environment');

const router = express.Router();

// Executar comando/script
router.post('/execute-command', async (req, res) => {
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

module.exports = router;
