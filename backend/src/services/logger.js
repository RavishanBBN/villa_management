const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Daily rotation transport for error logs
const errorRotateTransport = new DailyRotateFile({
  filename: path.join(__dirname, '../../logs/error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '30d',
  zippedArchive: true
});

// Daily rotation transport for combined logs
const combinedRotateTransport = new DailyRotateFile({
  filename: path.join(__dirname, '../../logs/combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  zippedArchive: true
});

// Daily rotation transport for audit logs
const auditRotateTransport = new DailyRotateFile({
  filename: path.join(__dirname, '../../logs/audit-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '90d', // Keep audit logs for 90 days
  zippedArchive: true
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'halcyon-rest-api' },
  transports: [
    errorRotateTransport,
    combinedRotateTransport,
    auditRotateTransport
  ]
});

// If not in production, log to console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Helper functions for common log scenarios
logger.logRequest = (req, message = 'API Request') => {
  logger.info(message, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
};

logger.logError = (req, message) => {
  // Handle both error objects and string messages
  if (typeof message === 'string') {
    logger.error(message, {
      ...(req && {
        method: req?.method,
        url: req?.originalUrl,
        ip: req?.ip
      })
    });
  } else if (message && message.message) {
    // message is an Error object
    const error = message;
    const errorLog = {
      message: error.message,
      stack: error.stack,
      ...(req && {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip
      })
    };
    logger.error('Application Error', errorLog);
  }
};

logger.logInfo = (req, message) => {
  logger.info(message, {
    ...(req && {
      method: req?.method,
      url: req?.originalUrl,
      ip: req?.ip
    })
  });
};

logger.logFinancial = (action, data) => {
  logger.info('Financial Transaction', {
    action,
    ...data,
    timestamp: new Date().toISOString()
  });
};

logger.logAuth = (action, userId, success) => {
  logger.info('Authentication Event', {
    action,
    userId,
    success,
    timestamp: new Date().toISOString()
  });
};

// Enhanced audit logging for critical operations
logger.logAudit = (userId, action, details) => {
  logger.info('Audit Log', {
    userId,
    action,
    details,
    timestamp: new Date().toISOString(),
    level: 'audit'
  });
};

// Log security events
logger.logSecurity = (event, details) => {
  logger.warn('Security Event', {
    event,
    details,
    timestamp: new Date().toISOString(),
    level: 'security'
  });
};

// Log reservation changes
logger.logReservation = (action, reservationId, userId, changes) => {
  logger.info('Reservation Event', {
    action,
    reservationId,
    userId,
    changes,
    timestamp: new Date().toISOString()
  });
};

module.exports = logger;
