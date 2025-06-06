
const express = require('express');
const db = require('../database');

const router = express.Router();

// Gerenciar usuários
router.get('/', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('❌ Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro ao carregar usuários' });
  }
});

router.post('/', async (req, res) => {
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

router.put('/:username', async (req, res) => {
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

router.delete('/:username', async (req, res) => {
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

module.exports = router;
