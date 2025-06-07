
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const logger = require('../config/logger');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token de acesso requerido' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar se a sessão ainda está ativa
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!session || !session.isActive || new Date() > session.expiresAt) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido ou expirado' 
      });
    }

    if (!session.user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuário inativo' 
      });
    }

    req.user = session.user;
    req.session = session;
    next();
  } catch (error) {
    logger.error('Authentication error', error);
    return res.status(403).json({ 
      success: false, 
      message: 'Token inválido' 
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ 
      success: false, 
      message: 'Acesso negado. Privilégios de administrador requeridos.' 
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
};
