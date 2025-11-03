/**
 * Halcyon Rest Villa Management System
 * Main Server Entry Point - Slim & Modular Architecture
 */

require('dotenv').config();
const express = require('express');
const path = require('path');

// Import configurations
const configureExpress = require('./config/express');
const { swaggerUi, swaggerSpec } = require('./config/swagger');
const logger = require('./services/logger');

// Import database
const db = require('./models');

// Import centralized routes
const routes = require('./routes');

// Import scheduled tasks service
const scheduledTasks = require('./services/scheduledTasks');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Set timezone
process.env.TZ = 'Asia/Kolkata';

// Configure Express middleware
configureExpress(app);

// Request logging middleware
app.use((req, res, next) => {
  logger.logRequest(req, `${req.method} ${req.originalUrl}`);
  next();
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Halcyon Rest API Documentation"
}));

// Mount all API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: '🏨 Halcyon Rest Management System',
    description: 'Complete management system for Halcyon Rest villa',
    property: 'Halcyon Rest - Two Floor Villa',
    location: 'Sri Lanka',
    units: 2,
    version: '2.0.0',
    status: 'Active',
    documentation: '/api-docs',
    api: '/api'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.logError(req, err);
  
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500,
      timestamp: new Date().toISOString()
    }
  });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      path: req.originalUrl,
      timestamp: new Date().toISOString()
    }
  });
});

// Start server and initialize database
const startServer = async () => {
  try {
    console.log('🚀 Starting Halcyon Rest Management System...');
    
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Sync database with timeout
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Syncing database...');
      const syncPromise = db.sequelize.sync({ alter: false });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database sync timeout')), 30000)
      );

      await Promise.race([syncPromise, timeoutPromise]);
      console.log('✅ Database synced successfully');
    }
    
    // Initialize scheduled tasks
    if (process.env.ENABLE_SCHEDULED_TASKS !== 'false') {
      console.log('⏰ Initializing scheduled tasks...');
      scheduledTasks.init();
      console.log('✅ Scheduled tasks initialized');
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log('🏨  HALCYON REST MANAGEMENT SYSTEM');
      console.log('='.repeat(60));
      console.log(`🌐  Server running on: http://localhost:${PORT}`);
      console.log(`📚  API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🔧  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🕐  Timezone: ${process.env.TZ}`);
      console.log(`📊  Database: Connected`);
      console.log(`⏰  Scheduled Tasks: ${process.env.ENABLE_SCHEDULED_TASKS !== 'false' ? 'Enabled' : 'Disabled'}`);
      console.log('='.repeat(60) + '\n');
      
      logger.logInfo(null, `Server started on port ${PORT}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    logger.logError(null, `Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  logger.logError(null, `Uncaught Exception: ${error.message}`);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  logger.logError(null, `Unhandled Rejection: ${reason}`);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('⚠️  SIGTERM received, shutting down gracefully...');
  
  // Stop scheduled tasks
  if (scheduledTasks && scheduledTasks.stopAll) {
    scheduledTasks.stopAll();
    console.log('✅ Scheduled tasks stopped');
  }
  
  await db.sequelize.close();
  console.log('✅ Database connection closed');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
