
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const scriptController = require('../controllers/scriptController');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

router.get('/', scriptController.getScripts);
router.post('/upload', scriptController.uploadScript);
router.post('/execute', scriptController.executeScript);
router.delete('/:id', scriptController.deleteScript);

module.exports = router;
