
const { prisma } = require('../config/database');
const logger = require('../config/logger');

const settingController = {
  // GET /api/settings - Buscar configurações
  getSettings: async (req, res) => {
    try {
      const { group } = req.query;

      const where = group ? { group } : {};
      
      const settings = await prisma.setting.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { key: 'asc' }
      });

      // Converter para formato chave-valor
      const settingsMap = {};
      settings.forEach(setting => {
        if (!settingsMap[setting.group]) {
          settingsMap[setting.group] = {};
        }
        settingsMap[setting.group][setting.key] = {
          value: setting.value,
          updatedBy: setting.user,
          updatedAt: setting.updatedAt
        };
      });

      logger.info('Settings retrieved', { 
        group, 
        count: settings.length, 
        userId: req.user?.id 
      });

      res.json({
        success: true,
        data: { settings: settingsMap }
      });
    } catch (error) {
      logger.error('Error retrieving settings', { 
        error: error.message, 
        userId: req.user?.id 
      });
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar configurações'
      });
    }
  },

  // POST /api/settings - Salvar configurações
  saveSettings: async (req, res) => {
    try {
      const { settings, group = 'general' } = req.body;

      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Configurações são obrigatórias'
        });
      }

      const savedSettings = [];

      // Salvar cada configuração
      for (const [key, value] of Object.entries(settings)) {
        const setting = await prisma.setting.upsert({
          where: { key },
          update: {
            value: String(value),
            group,
            updatedBy: req.user.id,
            updatedAt: new Date()
          },
          create: {
            key,
            value: String(value),
            group,
            updatedBy: req.user.id
          }
        });
        savedSettings.push(setting);
      }

      // Registrar no audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'SETTINGS_UPDATE',
          details: { 
            group, 
            keys: Object.keys(settings),
            settingsCount: savedSettings.length 
          },
          ipAddress: req.ip
        }
      });

      logger.info('Settings saved', { 
        group, 
        count: savedSettings.length, 
        userId: req.user.id 
      });

      res.json({
        success: true,
        data: { settings: savedSettings },
        message: 'Configurações salvas com sucesso'
      });
    } catch (error) {
      logger.error('Error saving settings', { 
        error: error.message, 
        userId: req.user?.id 
      });
      res.status(500).json({
        success: false,
        message: 'Erro ao salvar configurações'
      });
    }
  },

  // DELETE /api/settings/:key - Deletar configuração
  deleteSetting: async (req, res) => {
    try {
      const { key } = req.params;

      const setting = await prisma.setting.findUnique({
        where: { key }
      });

      if (!setting) {
        return res.status(404).json({
          success: false,
          message: 'Configuração não encontrada'
        });
      }

      await prisma.setting.delete({
        where: { key }
      });

      // Registrar no audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'SETTING_DELETE',
          details: { key, group: setting.group },
          ipAddress: req.ip
        }
      });

      logger.info('Setting deleted', { key, userId: req.user.id });

      res.json({
        success: true,
        message: 'Configuração removida com sucesso'
      });
    } catch (error) {
      logger.error('Error deleting setting', { 
        error: error.message, 
        userId: req.user?.id 
      });
      res.status(500).json({
        success: false,
        message: 'Erro ao remover configuração'
      });
    }
  }
};

module.exports = settingController;
