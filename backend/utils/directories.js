
const fs = require('fs');
const { DATA_DIR, SCRIPTS_DIR, LOGS_DIR, UPLOADS_DIR } = require('../config/environment');

// Create necessary directories
const createDirectories = () => {
  const dirs = [DATA_DIR, SCRIPTS_DIR, LOGS_DIR, UPLOADS_DIR];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Diretório criado: ${dir}`);
    }
  });
};

module.exports = {
  createDirectories
};
