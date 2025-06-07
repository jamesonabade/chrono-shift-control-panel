
const { prisma } = require('../config/database');
const logger = require('../config/logger');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuração do multer para upload de scripts
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = '/app/scripts';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

const scriptController = {
  // GET /api/scripts - Listar scripts
  getScripts: async (req, res) => {
    try {
      const scripts = await prisma.script.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      logger.info('Scripts retrieved', { count: scripts.length, userId: req.user?.id });

      res.json({
        success: true,
        data: { scripts }
      });
    } catch (error) {
      logger.error('Error retrieving scripts', { error: error.message, userId: req.user?.id });
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar scripts'
      });
    }
  },

  // POST /api/upload-script - Upload de script
  uploadScript: async (req, res) => {
    try {
      const upload = multer({ storage }).single('script');
      
      upload(req, res, async (err) => {
        if (err) {
          logger.error('Error uploading script', { error: err.message, userId: req.user?.id });
          return res.status(400).json({
            success: false,
            message: 'Erro no upload do arquivo'
          });
        }

        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'Nenhum arquivo enviado'
          });
        }

        const { type, description } = req.body;
        const fileName = req.file.filename;
        const filePath = req.file.path;

        // Dar permissão de execução
        fs.chmodSync(filePath, '755');

        // Ler conteúdo do arquivo
        const content = fs.readFileSync(filePath, 'utf8');

        // Salvar no banco de dados
        const script = await prisma.script.create({
          data: {
            name: fileName,
            filename: fileName,
            content: content,
            description: description || '',
            filePath: filePath,
            uploadedBy: req.user.id
          }
        });

        // Registrar ação no audit log
        await prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action: 'SCRIPT_UPLOAD',
            details: { scriptId: script.id, fileName, type, size: req.file.size },
            ipAddress: req.ip
          }
        });

        logger.info('Script uploaded successfully', {
          scriptId: script.id,
          fileName,
          type,
          userId: req.user.id
        });

        res.json({
          success: true,
          data: { script },
          message: 'Script enviado com sucesso'
        });
      });
    } catch (error) {
      logger.error('Error in script upload', { error: error.message, userId: req.user?.id });
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  },

  // POST /api/execute-script - Executar script
  executeScript: async (req, res) => {
    try {
      const { scriptId, environment = {}, action } = req.body;

      if (!scriptId) {
        return res.status(400).json({
          success: false,
          message: 'ID do script é obrigatório'
        });
      }

      const script = await prisma.script.findUnique({
        where: { id: scriptId }
      });

      if (!script) {
        return res.status(404).json({
          success: false,
          message: 'Script não encontrado'
        });
      }

      // Verificar se arquivo existe
      if (!fs.existsSync(script.filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Arquivo do script não encontrado no sistema'
        });
      }

      // Criar arquivo .env com as variáveis
      const envFile = '/app/scripts/.env';
      let envContent = '#!/bin/bash\n';
      
      Object.entries(environment).forEach(([key, value]) => {
        envContent += `export ${key}="${value}"\n`;
      });
      
      fs.writeFileSync(envFile, envContent);
      fs.chmodSync(envFile, '755');

      const logFile = `/app/logs/execution_${Date.now()}.log`;
      const command = `cd /app/scripts && source .env && bash ${script.filename}`;

      logger.info('Executing script', {
        scriptId: script.id,
        fileName: script.filename,
        action,
        environment,
        userId: req.user.id
      });

      exec(command, {
        cwd: '/app/scripts',
        env: { ...process.env, ...environment },
        uid: 0,
        gid: 0,
        shell: '/bin/bash'
      }, async (error, stdout, stderr) => {
        const logContent = `
Execution Time: ${new Date().toISOString()}
Action: ${action}
Script: ${script.filename}
User: ${req.user.name} (${req.user.email})
Environment Variables: ${JSON.stringify(environment, null, 2)}
Exit Code: ${error ? error.code || 1 : 0}

STDOUT:
${stdout}

STDERR:
${stderr}

ERROR:
${error ? error.message : 'None'}
        `.trim();
        
        fs.writeFileSync(logFile, logContent);

        // Registrar execução no banco
        await prisma.scriptAction.create({
          data: {
            scriptId: script.id,
            action: 'EXECUTE',
            userId: req.user.id,
            details: {
              environment,
              stdout,
              stderr,
              exitCode: error ? error.code || 1 : 0,
              logFile
            }
          }
        });

        // Registrar no audit log
        await prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action: 'SCRIPT_EXECUTE',
            details: {
              scriptId: script.id,
              scriptName: script.filename,
              action,
              success: !error,
              exitCode: error ? error.code || 1 : 0
            },
            ipAddress: req.ip
          }
        });

        if (error) {
          logger.error('Script execution failed', {
            scriptId: script.id,
            error: error.message,
            exitCode: error.code,
            userId: req.user.id
          });
          
          res.status(500).json({
            success: false,
            message: 'Erro na execução do script',
            error: error.message,
            stderr,
            stdout,
            logFile,
            exitCode: error.code
          });
        } else {
          logger.info('Script executed successfully', {
            scriptId: script.id,
            userId: req.user.id
          });
          
          res.json({
            success: true,
            message: `${action || 'Script'} executado com sucesso`,
            output: stdout,
            stderr,
            logFile
          });
        }
      });

    } catch (error) {
      logger.error('Error in script execution', { error: error.message, userId: req.user?.id });
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  },

  // DELETE /api/scripts/:id - Deletar script
  deleteScript: async (req, res) => {
    try {
      const { id } = req.params;

      const script = await prisma.script.findUnique({
        where: { id }
      });

      if (!script) {
        return res.status(404).json({
          success: false,
          message: 'Script não encontrado'
        });
      }

      // Remover arquivo físico se existir
      if (script.filePath && fs.existsSync(script.filePath)) {
        fs.unlinkSync(script.filePath);
      }

      // Remover do banco
      await prisma.script.delete({
        where: { id }
      });

      // Registrar no audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'SCRIPT_DELETE',
          details: { scriptId: id, fileName: script.filename },
          ipAddress: req.ip
        }
      });

      logger.info('Script deleted', { scriptId: id, fileName: script.filename, userId: req.user.id });

      res.json({
        success: true,
        message: 'Script removido com sucesso'
      });
    } catch (error) {
      logger.error('Error deleting script', { error: error.message, userId: req.user?.id });
      res.status(500).json({
        success: false,
        message: 'Erro ao remover script'
      });
    }
  }
};

module.exports = scriptController;
