
const cors = require('cors');
const express = require('express');
const { UPLOADS_DIR } = require('../config/environment');

const setupMiddleware = (app) => {
  // CORS
  app.use(cors({
    origin: true,
    credentials: true
  }));

  // Body parsing
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Servir uploads estáticos
  app.use('/uploads', express.static(UPLOADS_DIR));
};

module.exports = setupMiddleware;
