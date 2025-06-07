
const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const logController = require('../controllers/logController');

const router = express.Router();

// Todas as rotas requerem autenticação e privilégios de admin
router.use(authenticateToken, requireAdmin);

router.get('/', logController.getLogs);
router.get('/stats', logController.getLogStats);

module.exports = router;
