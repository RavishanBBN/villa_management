const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Halcyon Rest Management System API',
    version: '2.0.0',
    description: 'Complete API documentation for Halcyon Rest villa management system',
    contact: {
      name: 'Halcyon Rest Support',
      email: 'support@halcyonrest.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server'
    },
    {
      url: 'https://api.halcyonrest.com',
      description: 'Production server'
    }
  ],
  tags: [
    { name: 'Authentication', description: 'User authentication endpoints' },
    { name: 'Reservations', description: 'Reservation management' },
    { name: 'Financial', description: 'Financial management and reporting' },
    { name: 'Inventory', description: 'Inventory management' },
    { name: 'Messages', description: 'Internal messaging system' },
    { name: 'Calendar', description: 'Calendar and availability management' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          username: { type: 'string' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          role: { 
            type: 'string',
            enum: ['super_admin', 'admin', 'manager', 'front_desk', 'housekeeping', 'maintenance', 'finance']
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'suspended']
          }
        }
      },
      Property: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          unit: { type: 'string' },
          maxAdults: { type: 'integer' },
          maxChildren: { type: 'integer' },
          basePrice: { type: 'number' },
          currency: { type: 'string', default: 'LKR' }
        }
      },
      Reservation: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          confirmationNumber: { type: 'string' },
          unitId: { type: 'string' },
          guestInfo: {
            type: 'object',
            properties: {
              bookerName: { type: 'string' },
              email: { type: 'string' },
              phone: { type: 'string' },
              adults: { type: 'integer' },
              children: { type: 'integer' }
            }
          },
          dates: {
            type: 'object',
            properties: {
              checkIn: { type: 'string', format: 'date' },
              checkOut: { type: 'string', format: 'date' },
              nights: { type: 'integer' }
            }
          },
          pricing: {
            type: 'object',
            properties: {
              totalLKR: { type: 'number' },
              totalUSD: { type: 'number' }
            }
          },
          status: { type: 'string', enum: ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'] },
          paymentStatus: { type: 'string', enum: ['not-paid', 'advance-payment', 'full-payment'] }
        }
      },
      Revenue: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: ['accommodation', 'services', 'other'] },
          description: { type: 'string' },
          amount: { type: 'number' },
          date: { type: 'string', format: 'date' },
          paymentStatus: { type: 'string' }
        }
      },
      Expense: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          category: { type: 'string' },
          description: { type: 'string' },
          amount: { type: 'number' },
          vendor: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'paid'] }
        }
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: false },
          message: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      },
      Success: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: true },
          message: { type: 'string' },
          data: { type: 'object' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      }
    }
  }
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js', './src/server.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec
};
