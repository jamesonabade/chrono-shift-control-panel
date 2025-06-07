
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const dateActionController = require('../controllers/dateActionController');

const router = express.Router();

router.use(authenticateToken);

router.post('/', dateActionController.createDateAction);
router.get('/last', dateActionController.getLastDateAction);
router.get('/', dateActionController.getDateActions);

module.exports = router;
