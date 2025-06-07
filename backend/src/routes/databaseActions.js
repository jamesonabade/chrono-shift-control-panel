
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const databaseActionController = require('../controllers/databaseActionController');

const router = express.Router();

router.use(authenticateToken);

router.post('/', databaseActionController.createDatabaseAction);
router.get('/last', databaseActionController.getLastDatabaseAction);
router.get('/', databaseActionController.getDatabaseActions);

module.exports = router;
