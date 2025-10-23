// src/services/loggerService.js
// Simple logger service

class LoggerService {
  log(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    switch (level) {
      case 'error':
        console.error(logMessage, meta);
        break;
      case 'warn':
        console.warn(logMessage, meta);
        break;
      case 'info':
        console.info(logMessage, meta);
        break;
      case 'debug':
        console.debug(logMessage, meta);
        break;
      default:
        console.log(logMessage, meta);
    }
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }
}

module.exports = new LoggerService();