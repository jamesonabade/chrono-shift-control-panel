
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const customizationController = require('../controllers/customizationController');

const router = express.Router();

router.get('/', customizationController.getCustomizations);
router.put('/', authenticateToken, customizationController.updateCustomizations);

module.exports = router;
