
const express = require('express');
const db = require('../database');

const router = express.Router();

// Logs do sistema
router.get('/', async (req, res) => {
  try {
    const logs = await db.getLogs(100);
    res.json(logs);
  } catch (error) {
    console.error('❌ Erro ao buscar logs:', error);
    res.status(500).json({ error: 'Erro ao carregar logs' });
  }
});

module.exports = router;
