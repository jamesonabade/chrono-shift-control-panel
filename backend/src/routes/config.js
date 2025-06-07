
const express = require('express');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const configController = require('../controllers/configController');

const router = express.Router();

router.use(authenticateToken);

router.get('/', configController.getConfigs);
router.put('/', requireAdmin, validate(schemas.updateConfig), configController.updateConfig);
router.delete('/:key', requireAdmin, configController.deleteConfig);

module.exports = router;
