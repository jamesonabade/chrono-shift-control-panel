
const express = require('express');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const userController = require('../controllers/userController');

const router = express.Router();

// Todas as rotas requerem autenticação e privilégios de admin
router.use(authenticateToken, requireAdmin);

router.get('/', userController.getUsers);
router.post('/', validate(schemas.createUser), userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
