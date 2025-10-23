// src/routes/paymentRoutes.js
// Complete payment management for Halcyon Rest

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const db = require('../models');
const currencyService = require('../services/currencyService');

// GET /api/payments - Get all payments with filters
router.get('/', async (req, res) => {
  try {
    const { 
      reservationId, 
      status, 
      method, 
      currency,
      startDate,
      endDate,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const where = {};
    
    // Apply filters
    if (reservationId) where.reservationId = reservationId;
    if (status) where.status = status;
    if (method) where.method = method;
    if (currency) where.currency = currency;
    
    if (startDate || endDate) {
      where.paidAt = {};
      if (startDate) where.paidAt[Op.gte] = startDate;
      if (endDate) where.paidAt[Op.lte] = endDate;
    }
    
    const { count, rows } = await db.Payment.findAndCountAll({
      where,
      include: [{
        model: db.Reservation,
        as: 'reservation',
        include: [
          {
            model: db.Property,
            as: 'property',
            attributes: ['id', 'name', 'unit']
          },
          {
            model: db.Guest,
            as: 'guest',
            attributes: ['id', 'bookerName', 'country']
          }
        ]
      }],
      order: [['paidAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: {
        payments: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/payments - Record new payment
router.post('/', async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const {
      reservationId,
      amount,
      currency,
      method,
      transactionId,
      notes,
      receivedBy
    } = req.body;
    
    // Validation
    if (!reservationId || !amount || !currency || !method) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: reservationId, amount, currency, method',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if reservation exists
    const reservation = await db.Reservation.findByPk(reservationId, { transaction });
    
    if (!reservation) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Reservation not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Validate amount
    if (parseFloat(amount) <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than 0',
        timestamp: new Date().toISOString()
      });
    }
    
    // Create payment
    const payment = await db.Payment.create({
      reservationId,
      amount: parseFloat(amount),
      currency,
      method,
      transactionId,
      notes,
      receivedBy,
      status: 'completed',
      paidAt: new Date(),
      receiptNumber: 'RCP-' + Date.now().toString().slice(-8)
    }, { transaction });
    
    // Update reservation's total paid amount
    const payments = await db.Payment.findAll({
      where: {
        reservationId,
        status: 'completed'
      },
      transaction
    });
    
    const totalPaidInCurrency = payments
      .filter(p => p.currency === reservation.paymentCurrency)
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
    
    const totalDue = reservation.paymentCurrency === 'USD' 
      ? parseFloat(reservation.totalUSD)
      : parseFloat(reservation.totalLKR);
    
    await reservation.update({
      totalPaid: totalPaidInCurrency,
      balanceDue: totalDue - totalPaidInCurrency
    }, { transaction });
    
    await transaction.commit();
    
    // Fetch complete payment data
    const completePayment = await db.Payment.findByPk(payment.id, {
      include: [{
        model: db.Reservation,
        as: 'reservation',
        include: [
          {
            model: db.Property,
            as: 'property',
            attributes: ['id', 'name', 'unit']
          },
          {
            model: db.Guest,
            as: 'guest',
            attributes: ['id', 'bookerName', 'country']
          }
        ]
      }]
    });
    
    res.status(201).json({
      success: true,
      data: completePayment,
      message: 'Payment recorded successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Failed to record payment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/payments/:id - Get specific payment
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await db.Payment.findByPk(id, {
      include: [{
        model: db.Reservation,
        as: 'reservation',
        include: [
          {
            model: db.Property,
            as: 'property'
          },
          {
            model: db.Guest,
            as: 'guest'
          }
        ]
      }]
    });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: payment,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// PUT /api/payments/:id - Update payment
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const payment = await db.Payment.findByPk(id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
        timestamp: new Date().toISOString()
      });
    }
    
    await payment.update(updates);
    
    // Fetch updated payment
    const updatedPayment = await db.Payment.findByPk(id, {
      include: [{
        model: db.Reservation,
        as: 'reservation',
        include: [
          { model: db.Property, as: 'property' },
          { model: db.Guest, as: 'guest' }
        ]
      }]
    });
    
    res.json({
      success: true,
      data: updatedPayment,
      message: 'Payment updated successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update payment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/payments/:id/refund - Process refund
router.post('/:id/refund', async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;
    
    if (!amount || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Amount and reason are required for refund',
        timestamp: new Date().toISOString()
      });
    }
    
    const payment = await db.Payment.findByPk(id, { transaction });
    
    if (!payment) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
        timestamp: new Date().toISOString()
      });
    }
    
    if (payment.status !== 'completed') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Can only refund completed payments',
        timestamp: new Date().toISOString()
      });
    }
    
    const maxRefund = parseFloat(payment.amount) - parseFloat(payment.refundedAmount || 0);
    if (parseFloat(amount) > maxRefund) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Refund amount exceeds available amount. Max refundable: ${maxRefund}`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Update payment with refund information
    const newRefundedAmount = parseFloat(payment.refundedAmount || 0) + parseFloat(amount);
    const newStatus = newRefundedAmount >= parseFloat(payment.amount) ? 'refunded' : 'partially_refunded';
    
    await payment.update({
      refundedAmount: newRefundedAmount,
      refundReason: reason,
      refundedAt: new Date(),
      status: newStatus
    }, { transaction });
    
    // Update reservation's balance
    const reservation = await db.Reservation.findByPk(payment.reservationId, { transaction });
    if (reservation) {
      const newBalanceDue = parseFloat(reservation.balanceDue) + parseFloat(amount);
      await reservation.update({
        balanceDue: newBalanceDue,
        totalPaid: parseFloat(reservation.totalPaid) - parseFloat(amount)
      }, { transaction });
    }
    
    await transaction.commit();
    
    // Fetch updated payment
    const updatedPayment = await db.Payment.findByPk(id, {
      include: [{
        model: db.Reservation,
        as: 'reservation',
        include: [
          { model: db.Property, as: 'property' },
          { model: db.Guest, as: 'guest' }
        ]
      }]
    });
    
    res.json({
      success: true,
      data: updatedPayment,
      message: `Refund of ${amount} ${payment.currency} processed successfully`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/payments/reservation/:reservationId - Get payments for specific reservation
router.get('/reservation/:reservationId', async (req, res) => {
  try {
    const { reservationId } = req.params;
    
    const payments = await db.Payment.findAll({
      where: { reservationId },
      order: [['paidAt', 'DESC']]
    });
    
    // Calculate payment summary
    const summary = {
      totalPayments: payments.length,
      totalAmountLKR: 0,
      totalAmountUSD: 0,
      totalRefundedLKR: 0,
      totalRefundedUSD: 0,
      netAmountLKR: 0,
      netAmountUSD: 0,
      byMethod: {},
      byStatus: {}
    };
    
    payments.forEach(payment => {
      const amount = parseFloat(payment.amount);
      const refunded = parseFloat(payment.refundedAmount || 0);
      const net = amount - refunded;
      
      if (payment.currency === 'LKR') {
        summary.totalAmountLKR += amount;
        summary.totalRefundedLKR += refunded;
        summary.netAmountLKR += net;
      } else {
        summary.totalAmountUSD += amount;
        summary.totalRefundedUSD += refunded;
        summary.netAmountUSD += net;
      }
      
      // By method
      const methodKey = `${payment.method}_${payment.currency}`;
      summary.byMethod[methodKey] = (summary.byMethod[methodKey] || 0) + net;
      
      // By status
      summary.byStatus[payment.status] = (summary.byStatus[payment.status] || 0) + 1;
    });
    
    res.json({
      success: true,
      data: {
        payments,
        summary
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reservation payments',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/payments/summary/daily - Get daily payment summary
router.get('/summary/daily', async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const payments = await db.Payment.findAll({
      where: {
        paidAt: {
          [Op.between]: [startOfDay, endOfDay]
        },
        status: 'completed'
      },
      include: [{
        model: db.Reservation,
        as: 'reservation',
        include: [
          {
            model: db.Property,
            as: 'property',
            attributes: ['name', 'unit']
          }
        ]
      }]
    });
    
    const summary = {
      date,
      totalPayments: payments.length,
      totalAmountLKR: 0,
      totalAmountUSD: 0,
      byMethod: {},
      byProperty: {},
      payments: payments.map(p => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        method: p.method,
        property: p.reservation?.property?.name + ' - ' + p.reservation?.property?.unit,
        paidAt: p.paidAt,
        receiptNumber: p.receiptNumber
      }))
    };
    
    payments.forEach(payment => {
      const amount = parseFloat(payment.amount);
      
      if (payment.currency === 'LKR') {
        summary.totalAmountLKR += amount;
      } else {
        summary.totalAmountUSD += amount;
      }
      
      // By method
      const methodKey = `${payment.method}_${payment.currency}`;
      summary.byMethod[methodKey] = (summary.byMethod[methodKey] || 0) + amount;
      
      // By property
      if (payment.reservation?.property) {
        const propertyKey = payment.reservation.property.name + ' - ' + payment.reservation.property.unit;
        summary.byProperty[propertyKey] = (summary.byProperty[propertyKey] || 0) + amount;
      }
    });
    
    res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate daily payment summary',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/payments/summary/monthly - Get monthly payment summary
router.get('/summary/monthly', async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
    
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
    
    const payments = await db.Payment.findAll({
      where: {
        paidAt: {
          [Op.between]: [startOfMonth, endOfMonth]
        },
        status: 'completed'
      }
    });
    
    const summary = {
      year: parseInt(year),
      month: parseInt(month),
      totalPayments: payments.length,
      totalAmountLKR: 0,
      totalAmountUSD: 0,
      averagePaymentLKR: 0,
      averagePaymentUSD: 0,
      byMethod: {},
      byWeek: {}
    };
    
    payments.forEach(payment => {
      const amount = parseFloat(payment.amount);
      
      if (payment.currency === 'LKR') {
        summary.totalAmountLKR += amount;
      } else {
        summary.totalAmountUSD += amount;
      }
      
      // By method
      const methodKey = `${payment.method}_${payment.currency}`;
      summary.byMethod[methodKey] = (summary.byMethod[methodKey] || 0) + amount;
      
      // By week
      const weekNumber = Math.ceil(payment.paidAt.getDate() / 7);
      const weekKey = `week_${weekNumber}_${payment.currency}`;
      summary.byWeek[weekKey] = (summary.byWeek[weekKey] || 0) + amount;
    });
    
    // Calculate averages
    const lkrPayments = payments.filter(p => p.currency === 'LKR');
    const usdPayments = payments.filter(p => p.currency === 'USD');
    
    summary.averagePaymentLKR = lkrPayments.length > 0 ? 
      Math.round((summary.totalAmountLKR / lkrPayments.length) * 100) / 100 : 0;
    summary.averagePaymentUSD = usdPayments.length > 0 ? 
      Math.round((summary.totalAmountUSD / usdPayments.length) * 100) / 100 : 0;
    
    res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate monthly payment summary',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;