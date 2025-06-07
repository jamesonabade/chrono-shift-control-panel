
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const logger = require('../config/logger');

const login = async (req, res) => {
  try {
    const { email, password } = req.validatedData;
    
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.isActive) {
      await logAuthAttempt(email, false, req.ip, req.get('User-Agent'));
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      await logAuthAttempt(email, false, req.ip, req.get('User-Agent'));
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Gerar token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Criar sessão
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const session = await prisma.session.create({
      data: {
        token,
        userId: user.id,
        expiresAt
      }
    });

    // Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    await logAuthAttempt(email, true, req.ip, req.get('User-Agent'), user.id);

    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    logger.error('Login error', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const logout = async (req, res) => {
  try {
    // Desativar sessão
    await prisma.session.update({
      where: { token: req.session.token },
      data: { isActive: false }
    });

    logger.info('User logged out', {
      userId: req.user.id,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    logger.error('Logout error', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    logger.error('Get user profile error', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const logAuthAttempt = async (email, success, ip, userAgent, userId = null) => {
  try {
    await prisma.systemLog.create({
      data: {
        level: success ? 'INFO' : 'WARN',
        action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
        message: success ? 'Login realizado com sucesso' : 'Tentativa de login falhada',
        details: { email, ip, userAgent },
        userId,
        ipAddress: ip,
        userAgent
      }
    });
  } catch (error) {
    logger.error('Failed to log auth attempt', error);
  }
};

module.exports = {
  login,
  logout,
  me,
};
