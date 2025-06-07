
const { prisma } = require('../config/database');
const logger = require('../config/logger');

const getCustomizations = async (req, res) => {
  try {
    const customization = await prisma.systemCustomization.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      success: true,
      data: customization || {}
    });
  } catch (error) {
    logger.error('Get customizations error', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const updateCustomizations = async (req, res) => {
  try {
    const {
      title,
      logoHash,
      logoSize,
      backgroundHash,
      backgroundOpacity,
      faviconHash
    } = req.body;

    // Buscar customização existente ou criar nova
    const existing = await prisma.systemCustomization.findFirst();

    const customization = existing
      ? await prisma.systemCustomization.update({
          where: { id: existing.id },
          data: {
            title,
            logoHash,
            logoSize,
            backgroundHash,
            backgroundOpacity,
            faviconHash,
            updatedAt: new Date()
          }
        })
      : await prisma.systemCustomization.create({
          data: {
            title,
            logoHash,
            logoSize,
            backgroundHash,
            backgroundOpacity,
            faviconHash
          }
        });

    // Log da ação
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        action: 'CUSTOMIZATION_UPDATED',
        message: 'Personalizações do sistema atualizadas',
        details: { title, logoSize, backgroundOpacity },
        userId: req.user?.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    logger.info('Customizations updated', {
      userId: req.user?.id,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Personalizações atualizadas com sucesso',
      data: { customization }
    });
  } catch (error) {
    logger.error('Update customizations error', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  getCustomizations,
  updateCustomizations,
};
