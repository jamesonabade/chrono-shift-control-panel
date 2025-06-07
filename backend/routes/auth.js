
const express = require('express');
const db = require('../database');

const router = express.Router();

// Autenticação
router.post('/login', async (req, res) => {
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

module.exports = router;
