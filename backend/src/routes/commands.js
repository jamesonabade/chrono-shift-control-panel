
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const commandController = require('../controllers/commandController');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

router.get('/', commandController.getCommands);
router.post('/', commandController.createCommand);
router.post('/execute', commandController.executeCommand);
router.delete('/:id', commandController.deleteCommand);

module.exports = router;
