
// Environment configuration and constants
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 3001;
const DATA_DIR = process.env.DATA_DIR || '/app/data';
const SCRIPTS_DIR = process.env.SCRIPTS_DIR || '/app/scripts';
const LOGS_DIR = process.env.LOGS_DIR || '/app/logs';
const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads';
const BASE_PATH = process.env.BASE_PATH || '';

module.exports = {
  NODE_ENV,
  PORT,
  DATA_DIR,
  SCRIPTS_DIR,
  LOGS_DIR,
  UPLOADS_DIR,
  BASE_PATH
};
