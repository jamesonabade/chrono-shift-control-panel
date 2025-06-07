
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const settingController = require('../controllers/settingController');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

router.get('/', settingController.getSettings);
router.post('/', settingController.saveSettings);
router.delete('/:key', settingController.deleteSetting);

module.exports = router;
