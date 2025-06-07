
const { prisma } = require('../config/database');
const logger = require('../config/logger');

const getConfigs = async (req, res) => {
  try {
    const { category, isPublic } = req.query;
    
    const where = {};
    if (category) where.category = category;
    
    // Usuários não-admin só veem configs públicas
    if (req.user.role !== 'ADMIN') {
      where.isPublic = true;
    } else if (isPublic !== undefined) {
      where.isPublic = isPublic === 'true';
    }

    const configs = await prisma.systemConfig.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: { configs }
    });
  } catch (error) {
    logger.error('Get configs error', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const updateConfig = async (req, res) => {
  try {
    const { key, value, description, category, isPublic } = req.validatedData;

    const config = await prisma.systemConfig.upsert({
      where: { key },
      update: {
        value,
        description,
        category,
        isPublic,
        updatedAt: new Date()
      },
      create: {
        key,
        value,
        description,
        category,
        isPublic
      }
    });

    // Log da alteração
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        action: 'CONFIG_UPDATED',
        message: `Configuração ${key} atualizada`,
        details: { key, value, category, isPublic },
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    logger.info('Configuration updated', {
      key,
      userId: req.user.id,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Configuração atualizada com sucesso',
      data: { config }
    });
  } catch (error) {
    logger.error('Update config error', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const deleteConfig = async (req, res) => {
  try {
    const { key } = req.params;

    const config = await prisma.systemConfig.findUnique({
      where: { key }
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuração não encontrada'
      });
    }

    await prisma.systemConfig.delete({
      where: { key }
    });

    // Log da exclusão
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        action: 'CONFIG_DELETED',
        message: `Configuração ${key} removida`,
        details: { key, deletedConfig: config },
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    logger.info('Configuration deleted', {
      key,
      userId: req.user.id,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Configuração removida com sucesso'
    });
  } catch (error) {
    logger.error('Delete config error', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  getConfigs,
  updateConfig,
  deleteConfig,
};
