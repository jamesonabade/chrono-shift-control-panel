
const express = require('express');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const upload = require('../utils/multer');
const db = require('../database');
const { SCRIPTS_DIR } = require('../config/environment');

const router = express.Router();

// Upload de scripts
router.post('/upload-script', upload.single('script'), async (req, res) => {
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
router.get('/', async (req, res) => {
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

module.exports = router;
