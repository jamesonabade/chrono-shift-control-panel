
const { prisma } = require('../config/database');
const logger = require('../config/logger');
const { exec } = require('child_process');
const fs = require('fs');

const commandController = {
  // POST /api/execute-command - Executar comando personalizado
  executeCommand: async (req, res) => {
    try {
      const { command, name, description, environment = {} } = req.body;
      
      if (!command) {
        return res.status(400).json({ 
          success: false, 
          message: 'Comando é obrigatório'
        });
      }

      // Registrar comando se não existir
      let commandRecord = null;
      if (name) {
        commandRecord = await prisma.command.upsert({
          where: { name },
          update: {
            command,
            description: description || '',
            lastExecuted: new Date(),
            updatedAt: new Date()
          },
          create: {
            name,
            command,
            description: description || '',
            type: 'custom',
            createdBy: req.user.id,
            lastExecuted: new Date()
          }
        });
      }

      const logFile = `/app/logs/command_${Date.now()}.log`;
      
      logger.info('Executing custom command', {
        command,
        name: name || 'Comando personalizado',
        description,
        environment,
        userId: req.user.id
      });
      
      // Preparar variáveis de ambiente
      const execEnv = { ...process.env, ...environment };
      
      exec(command, { 
        cwd: '/app',
        env: execEnv,
        uid: 0,
        gid: 0,
        shell: '/bin/bash'
      }, async (error, stdout, stderr) => {
        const logContent = `
Execution Time: ${new Date().toISOString()}
Command: ${command}
Name: ${name || 'Comando personalizado'}
Description: ${description || 'N/A'}
User: ${req.user.name} (${req.user.email})
Environment: ${JSON.stringify(environment, null, 2)}
Exit Code: ${error ? error.code || 1 : 0}

STDOUT:
${stdout}

STDERR:
${stderr}

ERROR:
${error ? error.message : 'None'}
        `.trim();
        
        fs.writeFileSync(logFile, logContent);

        // Registrar execução no banco se há um comando registrado
        if (commandRecord) {
          await prisma.commandAction.create({
            data: {
              commandId: commandRecord.id,
              userId: req.user.id,
              result: {
                stdout,
                stderr,
                exitCode: error ? error.code || 1 : 0,
                environment,
                logFile
              },
              success: !error
            }
          });
        }

        // Registrar no audit log
        await prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action: 'COMMAND_EXECUTE',
            details: {
              command,
              name: name || 'Comando personalizado',
              success: !error,
              exitCode: error ? error.code || 1 : 0
            },
            ipAddress: req.ip
          }
        });
        
        if (error) {
          logger.error('Command execution failed', {
            command,
            name,
            error: error.message,
            exitCode: error.code,
            userId: req.user.id
          });
          
          res.status(500).json({
            success: false,
            message: `Erro na execução: ${error.message}`,
            error: error.message,
            stderr,
            stdout,
            logFile,
            exitCode: error.code
          });
        } else {
          logger.info('Command executed successfully', {
            command,
            name,
            userId: req.user.id
          });
          
          res.json({
            success: true,
            message: `${name || 'Comando'} executado com sucesso`,
            output: stdout,
            stderr,
            logFile
          });
        }
      });
      
    } catch (error) {
      logger.error('Error in command execution setup', { 
        error: error.message,
        userId: req.user?.id
      });
      res.status(500).json({ 
        success: false, 
        message: `Erro interno: ${error.message}`
      });
    }
  },

  // GET /api/commands - Listar comandos salvos
  getCommands: async (req, res) => {
    try {
      const commands = await prisma.command.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: { executions: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      logger.info('Commands retrieved', { count: commands.length, userId: req.user?.id });

      res.json({
        success: true,
        data: { commands }
      });
    } catch (error) {
      logger.error('Error retrieving commands', { error: error.message, userId: req.user?.id });
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar comandos'
      });
    }
  },

  // POST /api/commands - Criar novo comando
  createCommand: async (req, res) => {
    try {
      const { name, command, description, type, buttonType } = req.body;

      if (!name || !command) {
        return res.status(400).json({
          success: false,
          message: 'Nome e comando são obrigatórios'
        });
      }

      const newCommand = await prisma.command.create({
        data: {
          name,
          command,
          description: description || '',
          type: type || 'custom',
          buttonType,
          createdBy: req.user.id
        }
      });

      // Registrar no audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'COMMAND_CREATE',
          details: { commandId: newCommand.id, name, command },
          ipAddress: req.ip
        }
      });

      logger.info('Command created', { commandId: newCommand.id, name, userId: req.user.id });

      res.json({
        success: true,
        data: { command: newCommand },
        message: 'Comando criado com sucesso'
      });
    } catch (error) {
      logger.error('Error creating command', { error: error.message, userId: req.user?.id });
      res.status(500).json({
        success: false,
        message: 'Erro ao criar comando'
      });
    }
  },

  // DELETE /api/commands/:id - Deletar comando
  deleteCommand: async (req, res) => {
    try {
      const { id } = req.params;

      const command = await prisma.command.findUnique({
        where: { id }
      });

      if (!command) {
        return res.status(404).json({
          success: false,
          message: 'Comando não encontrado'
        });
      }

      await prisma.command.delete({
        where: { id }
      });

      // Registrar no audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'COMMAND_DELETE',
          details: { commandId: id, name: command.name },
          ipAddress: req.ip
        }
      });

      logger.info('Command deleted', { commandId: id, name: command.name, userId: req.user.id });

      res.json({
        success: true,
        message: 'Comando removido com sucesso'
      });
    } catch (error) {
      logger.error('Error deleting command', { error: error.message, userId: req.user?.id });
      res.status(500).json({
        success: false,
        message: 'Erro ao remover comando'
      });
    }
  }
};

module.exports = commandController;
