
const { prisma } = require('../config/database');
const logger = require('../config/logger');

const getLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      level, 
      action, 
      userId, 
      startDate, 
      endDate 
    } = req.query;
    
    const where = {};
    
    if (level) where.level = level;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (userId) where.userId = userId;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.systemLog.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Get logs error', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const getLogStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [totalLogs, logsByLevel, logsByAction, recentActivity] = await Promise.all([
      prisma.systemLog.count({ where }),
      
      prisma.systemLog.groupBy({
        by: ['level'],
        where,
        _count: { level: true }
      }),
      
      prisma.systemLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10
      }),
      
      prisma.systemLog.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    res.json({
      success: true,
      data: {
        totalLogs,
        logsByLevel: logsByLevel.reduce((acc, item) => {
          acc[item.level] = item._count.level;
          return acc;
        }, {}),
        topActions: logsByAction.map(item => ({
          action: item.action,
          count: item._count.action
        })),
        recentActivity
      }
    });
  } catch (error) {
    logger.error('Get log stats error', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  getLogs,
  getLogStats,
};
