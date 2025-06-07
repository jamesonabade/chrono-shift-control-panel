
const { prisma } = require('../config/database');
const logger = require('../config/logger');

const createDatabaseAction = async (req, res) => {
  try {
    const { environment, variables } = req.body;

    const databaseAction = await prisma.databaseAction.create({
      data: {
        environment,
        userId: req.user.id,
        variables: variables || {}
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Log da ação
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        action: 'DATABASE_RESTORED',
        message: `Banco restaurado no ambiente: ${environment}`,
        details: { environment, variables },
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    logger.info('Database action created', {
      environment,
      userId: req.user.id,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Ação de banco registrada com sucesso',
      data: { databaseAction }
    });
  } catch (error) {
    logger.error('Create database action error', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const getLastDatabaseAction = async (req, res) => {
  try {
    const lastAction = await prisma.databaseAction.findFirst({
      orderBy: { restoredAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: { lastAction }
    });
  } catch (error) {
    logger.error('Get last database action error', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const getDatabaseActions = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const [actions, total] = await Promise.all([
      prisma.databaseAction.findMany({
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { restoredAt: 'desc' }
      }),
      prisma.databaseAction.count()
    ]);

    res.json({
      success: true,
      data: {
        actions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Get database actions error', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  createDatabaseAction,
  getLastDatabaseAction,
  getDatabaseActions,
};
