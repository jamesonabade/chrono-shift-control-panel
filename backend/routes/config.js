
const express = require('express');
const db = require('../database');

const router = express.Router();

// Personalizações
router.get('/customizations', async (req, res) => {
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

router.post('/customizations', async (req, res) => {
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
router.get('/system-variables', async (req, res) => {
  try {
    const variables = await db.getConfig('systemVariables');
    res.json(variables || {});
  } catch (error) {
    console.error('❌ Erro ao buscar variáveis:', error);
    res.status(500).json({ error: 'Erro ao carregar variáveis' });
  }
});

router.post('/system-variables', async (req, res) => {
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

module.exports = router;
