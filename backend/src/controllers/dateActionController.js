
const { prisma } = require('../config/database');
const logger = require('../config/logger');

const createDateAction = async (req, res) => {
  try {
    const { date, variables } = req.body;

    const dateAction = await prisma.dateAction.create({
      data: {
        date,
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
        action: 'DATE_APPLIED',
        message: `Data aplicada: ${date}`,
        details: { date, variables },
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    logger.info('Date action created', {
      date,
      userId: req.user.id,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Data aplicada com sucesso',
      data: { dateAction }
    });
  } catch (error) {
    logger.error('Create date action error', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const getLastDateAction = async (req, res) => {
  try {
    const lastAction = await prisma.dateAction.findFirst({
      orderBy: { appliedAt: 'desc' },
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
    logger.error('Get last date action error', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const getDateActions = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const [actions, total] = await Promise.all([
      prisma.dateAction.findMany({
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
        orderBy: { appliedAt: 'desc' }
      }),
      prisma.dateAction.count()
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
    logger.error('Get date actions error', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  createDateAction,
  getLastDateAction,
  getDateActions,
};
