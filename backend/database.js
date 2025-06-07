
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do pool de conexões PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Função para executar queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('🔍 Query executada:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Erro na query:', { text, error: error.message });
    throw error;
  }
};

// Função para inicializar o banco de dados
const initializeDatabase = async () => {
  try {
    console.log('🗄️ Inicializando banco de dados...');
    
    // Criar tabela de usuários
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        permissions JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Criar tabela de configurações
    await query(`
      CREATE TABLE IF NOT EXISTS system_config (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Criar tabela de logs
    await query(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        level VARCHAR(20) DEFAULT 'info',
        action VARCHAR(100) NOT NULL,
        details JSONB DEFAULT '{}',
        message TEXT,
        username VARCHAR(50),
        ip_address INET
      )
    `);
    
    // Criar índices
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);
      CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs(action);
    `);
    
    console.log('✅ Tabelas criadas com sucesso');
    
    // Verificar e inserir usuários padrão
    await insertDefaultUsers();
    await insertDefaultConfig();
    
    console.log('✅ Banco de dados inicializado com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    throw error;
  }
};

// Inserir usuários padrão
const insertDefaultUsers = async () => {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const userPassword = process.env.USER_PASSWORD || 'user123';
    
    // Verificar se administrador existe
    const adminExists = await query('SELECT id FROM users WHERE username = $1', ['administrador']);
    if (adminExists.rows.length === 0) {
      await query(
        'INSERT INTO users (username, password, permissions) VALUES ($1, $2, $3)',
        ['administrador', adminPassword, JSON.stringify({
          date: true,
          database: true,
          scripts: true,
          commands: true,
          users: true,
          logs: true,
          config: true
        })]
      );
      console.log('✅ Usuário administrador criado');
    } else {
      // Atualizar senha do administrador se mudou
      await query('UPDATE users SET password = $1 WHERE username = $2', [adminPassword, 'administrador']);
      console.log('🔄 Senha do administrador atualizada');
    }
    
    // Verificar se usuário padrão existe
    const userExists = await query('SELECT id FROM users WHERE username = $1', ['usuario']);
    if (userExists.rows.length === 0) {
      await query(
        'INSERT INTO users (username, password, permissions) VALUES ($1, $2, $3)',
        ['usuario', userPassword, JSON.stringify({
          date: true,
          database: false,
          scripts: true,
          commands: false,
          users: false,
          logs: true,
          config: false
        })]
      );
      console.log('✅ Usuário padrão criado');
    } else {
      // Atualizar senha do usuário se mudou
      await query('UPDATE users SET password = $1 WHERE username = $2', [userPassword, 'usuario']);
      console.log('🔄 Senha do usuário atualizada');
    }
    
  } catch (error) {
    console.error('❌ Erro ao inserir usuários padrão:', error);
    throw error;
  }
};

// Inserir configuração padrão
const insertDefaultConfig = async () => {
  try {
    const defaultCustomizations = {
      background: '',
      logo: '',
      favicon: '',
      title: process.env.SYSTEM_TITLE || 'PAINEL DE CONTROLE',
      subtitle: process.env.SYSTEM_SUBTITLE || 'Sistema de Gerenciamento Docker'
    };
    
    // Verificar se configuração existe
    const configExists = await query('SELECT id FROM system_config WHERE key = $1', ['customizations']);
    if (configExists.rows.length === 0) {
      await query(
        'INSERT INTO system_config (key, value) VALUES ($1, $2)',
        ['customizations', JSON.stringify(defaultCustomizations)]
      );
      console.log('✅ Configuração padrão criada');
    }
    
  } catch (error) {
    console.error('❌ Erro ao inserir configuração padrão:', error);
    throw error;
  }
};

// Funções de conveniência para operações comuns
const getUser = async (username) => {
  const result = await query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0];
};

const getAllUsers = async () => {
  const result = await query('SELECT username, permissions, created_at FROM users ORDER BY username');
  return result.rows;
};

const createUser = async (username, password, permissions = {}) => {
  const result = await query(
    'INSERT INTO users (username, password, permissions) VALUES ($1, $2, $3) RETURNING id',
    [username, password, JSON.stringify(permissions)]
  );
  return result.rows[0];
};

const updateUser = async (username, updates) => {
  const setClause = [];
  const values = [];
  let paramIndex = 1;
  
  if (updates.password) {
    setClause.push(`password = $${paramIndex++}`);
    values.push(updates.password);
  }
  
  if (updates.permissions) {
    setClause.push(`permissions = $${paramIndex++}`);
    values.push(JSON.stringify(updates.permissions));
  }
  
  setClause.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(username);
  
  const result = await query(
    `UPDATE users SET ${setClause.join(', ')} WHERE username = $${paramIndex}`,
    values
  );
  
  return result.rowCount > 0;
};

const deleteUser = async (username) => {
  const result = await query('DELETE FROM users WHERE username = $1', [username]);
  return result.rowCount > 0;
};

const getConfig = async (key) => {
  const result = await query('SELECT value FROM system_config WHERE key = $1', [key]);
  return result.rows[0]?.value;
};

const setConfig = async (key, value) => {
  const result = await query(`
    INSERT INTO system_config (key, value) 
    VALUES ($1, $2) 
    ON CONFLICT (key) 
    DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
  `, [key, JSON.stringify(value)]);
  return result.rowCount > 0;
};

const logAction = async (action, details = {}, username = 'system', ipAddress = null) => {
  try {
    await query(
      'INSERT INTO system_logs (action, details, username, ip_address) VALUES ($1, $2, $3, $4)',
      [action, JSON.stringify(details), username, ipAddress]
    );
  } catch (error) {
    console.error('❌ Erro ao registrar log:', error);
  }
};

const getLogs = async (limit = 100) => {
  const result = await query(`
    SELECT * FROM system_logs 
    ORDER BY timestamp DESC 
    LIMIT $1
  `, [limit]);
  return result.rows;
};

module.exports = {
  query,
  pool,
  initializeDatabase,
  getUser,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getConfig,
  setConfig,
  logAction,
  getLogs
};
