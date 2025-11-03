const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('✅ Created logs directory');
}

// Create write streams for different log files
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

const errorLogStream = fs.createWriteStream(
  path.join(logsDir, 'error.log'),
  { flags: 'a' }
);

// Custom token for logging user info
morgan.token('user-id', (req) => {
  return req.user ? req.user.id : 'anonymous';
});

morgan.token('user-role', (req) => {
  return req.user ? req.user.role : 'none';
});

// Custom format for detailed logging
const detailedFormat = ':remote-addr - :user-id [:user-role] [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

// Development logger (console)
const devLogger = morgan('dev');

// Production logger (file)
const prodLogger = morgan(detailedFormat, {
  stream: accessLogStream,
  skip: (req, res) => res.statusCode < 400
});

// Error logger
const errorLogger = morgan(detailedFormat, {
  stream: errorLogStream,
  skip: (req, res) => res.statusCode < 400
});

// Combined logger
const combinedLogger = (req, res, next) => {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    devLogger(req, res, () => {});
  }
  
  // Always log to file
  prodLogger(req, res, () => {});
  
  // Log errors separately
  errorLogger(req, res, () => {});
  
  next();
};

// Rate limiting configurations
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
    retryAfter: '15 minutes',
    timestamp: new Date().toISOString()
  },
  skipSuccessfulRequests: true
});

// Moderate limit for API endpoints
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    message: 'Too many API requests, please slow down.',
    timestamp: new Date().toISOString()
  }
});

// Lenient limit for file uploads
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: {
    success: false,
    message: 'Upload limit reached, please try again later.',
    timestamp: new Date().toISOString()
  }
});

module.exports = {
  combinedLogger,
  devLogger,
  prodLogger,
  errorLogger,
  generalLimiter,
  authLimiter,
  apiLimiter,
  uploadLimiter
};
