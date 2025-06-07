
const express = require('express');
const db = require('../database');
const upload = require('../utils/multer');

const router = express.Router();

// Configurações do sistema
router.get('/customizations', async (req, res) => {
  try {
    const customizations = await db.getConfig('customizations');
    res.json(customizations || {
      background: '',
      logo: '',
      favicon: '',
      title: process.env.SYSTEM_TITLE || 'PAINEL DE CONTROLE',
      subtitle: process.env.SYSTEM_SUBTITLE || 'Sistema de Gerenciamento Docker'
    });
  } catch (error) {
    console.error('❌ Erro ao buscar configurações:', error);
    res.status(500).json({ error: 'Erro ao carregar configurações' });
  }
});

router.post('/customizations', upload.fields([
  { name: 'background', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
  { name: 'favicon', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, subtitle } = req.body;
    const files = req.files;
    
    // Buscar configuração atual
    const currentConfig = await db.getConfig('customizations') || {};
    
    const newConfig = {
      background: files?.background ? `/uploads/${files.background[0].filename}` : currentConfig.background || '',
      logo: files?.logo ? `/uploads/${files.logo[0].filename}` : currentConfig.logo || '',
      favicon: files?.favicon ? `/uploads/${files.favicon[0].filename}` : currentConfig.favicon || '',
      title: title || currentConfig.title || process.env.SYSTEM_TITLE || 'PAINEL DE CONTROLE',
      subtitle: subtitle || currentConfig.subtitle || process.env.SYSTEM_SUBTITLE || 'Sistema de Gerenciamento Docker'
    };
    
    await db.setConfig('customizations', newConfig);
    await db.logAction('CUSTOMIZATIONS_UPDATED', newConfig, req.headers['x-user'] || 'system');
    
    res.json({ success: true, customizations: newConfig });
  } catch (error) {
    console.error('❌ Erro ao salvar configurações:', error);
    res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
});

module.exports = router;
