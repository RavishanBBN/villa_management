/**
 * Route Aggregator
 * Central router that combines all API routes
 */

const express = require('express');
const router = express.Router();

// Import all route modules
const reservationRoutes = require('./reservationRoutes');
const propertyRoutes = require('./propertyRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const financialRoutes = require('./financialRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const invoiceRoutes = require('./invoiceRoutes');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const emailRoutes = require('./emailRoutes');
const exportRoutes = require('./exportRoutes');
const guestRoutes = require('./guestRoutes');
const paymentRoutes = require('./paymentRoutes');
const expenseRoutes = require('./expenseRoutes');
const revenueRoutes = require('./revenueRoutes');
const reportRoutes = require('./reportRoutes');
const messageRoutes = require('./messageRoutes');
const uploadRoutes = require('./uploadRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const calendarRoutes = require('./calendarRoutes');
const notificationRoutes = require('./notificationRoutes');
const auditRoutes = require('./auditRoutes');

// Mount routes
router.use('/reservations', reservationRoutes);
router.use('/properties', propertyRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/financial', financialRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/email', emailRoutes);
router.use('/export', exportRoutes);
router.use('/guests', guestRoutes);
router.use('/payments', paymentRoutes);
router.use('/expenses', expenseRoutes);
router.use('/revenues', revenueRoutes);
router.use('/reports', reportRoutes);
router.use('/messages', messageRoutes);
router.use('/uploads', uploadRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/calendar', calendarRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit', auditRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'Halcyon Rest Villa Management API',
    version: '2.0.0',
    description: 'Complete property management system for Halcyon Rest',
    endpoints: {
      reservations: '/api/reservations',
      properties: '/api/properties',
      guests: '/api/guests',
      payments: '/api/payments',
      dashboard: '/api/dashboard',
      financial: '/api/financial',
      expenses: '/api/expenses',
      revenues: '/api/revenues',
      reports: '/api/reports',
      inventory: '/api/inventory',
      invoices: '/api/invoices',
      messages: '/api/messages',
      auth: '/api/auth',
      users: '/api/users',
      email: '/api/email',
      export: '/api/export',
      uploads: '/api/uploads',
      analytics: '/api/analytics',
      calendar: '/api/calendar',
      notifications: '/api/notifications',
      audit: '/api/audit',
      health: '/api/health',
      docs: '/api-docs'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
