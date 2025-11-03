// =====================================================================
// PAYMENT CONTROLLER - Payment Processing with Automated Accounting
// =====================================================================

const db = require('../models');
const accountingService = require('../services/accountingService');
const { Op } = require('sequelize');

/**
 * Create a new payment with automated journal entries
 * POST /api/payments
 */
exports.createPayment = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const {
      reservationId,
      amount,
      currency,
      method,
      status,
      transactionId,
      notes,
      paidAt
    } = req.body;

    if (!reservationId || !amount || !method) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: reservationId, amount, method'
      });
    }

    // Verify reservation exists
    const reservation = await db.Reservation.findByPk(reservationId, {
      include: [
        { model: db.Guest, as: 'guest' },
        { model: db.Property, as: 'property' }
      ],
      transaction
    });

    if (!reservation) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    // Create payment record
    const payment = await db.Payment.create({
      reservationId,
      amount,
      currency: currency || 'LKR',
      method,
      status: status || 'completed',
      transactionId: transactionId || null,
      notes: notes || null,
      paidAt: paidAt || new Date()
    }, { transaction });

    // Record revenue in automated accounting system (only for completed payments)
    if (payment.status === 'completed') {
      try {
        await accountingService.recordReservationRevenue(
          reservation,
          payment,
          transaction
        );
      } catch (accountingError) {
        console.error('Accounting error (non-critical):', accountingError);
        // Continue even if accounting fails - payment is still recorded
      }
    }

    // Update reservation payment status
    const payments = await db.Payment.findAll({
      where: {
        reservationId,
        status: 'completed'
      },
      transaction
    });

    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const totalAmount = parseFloat(reservation.totalAmount);

    let newPaymentStatus = 'not_paid';
    if (totalPaid >= totalAmount) {
      newPaymentStatus = 'full_payment';
    } else if (totalPaid > 0) {
      newPaymentStatus = 'advance_payment';
    }

    await reservation.update({ paymentStatus: newPaymentStatus }, { transaction });

    await transaction.commit();

    // Reload payment with associations
    const createdPayment = await db.Payment.findByPk(payment.id, {
      include: [
        {
          model: db.Reservation,
          as: 'reservation',
          include: [
            { model: db.Guest, as: 'guest', attributes: ['firstName', 'lastName', 'email'] },
            { model: db.Property, as: 'property', attributes: ['name', 'unit'] }
          ]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully with automated accounting entries',
      data: createdPayment
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment',
      error: error.message
    });
  }
};

/**
 * Get all payments
 * GET /api/payments
 */
exports.getAllPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      reservationId,
      method,
      status,
      startDate,
      endDate
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (reservationId) where.reservationId = reservationId;
    if (method) where.method = method;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.paidAt = {};
      if (startDate) where.paidAt[Op.gte] = new Date(startDate);
      if (endDate) where.paidAt[Op.lte] = new Date(endDate);
    }

    const { count, rows: payments } = await db.Payment.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['paidAt', 'DESC']],
      include: [
        {
          model: db.Reservation,
          as: 'reservation',
          attributes: ['confirmationNumber', 'totalAmount', 'paymentStatus'],
          include: [
            {
              model: db.Guest,
              as: 'guest',
              attributes: ['firstName', 'lastName', 'email']
            }
          ]
        }
      ]
    });

    res.json({
      success: true,
      data: payments,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error getting payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payments',
      error: error.message
    });
  }
};

/**
 * Get payment by ID
 * GET /api/payments/:id
 */
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await db.Payment.findByPk(id, {
      include: [
        {
          model: db.Reservation,
          as: 'reservation',
          include: [
            {
              model: db.Guest,
              as: 'guest',
              attributes: ['firstName', 'lastName', 'email', 'phone']
            },
            {
              model: db.Property,
              as: 'property',
              attributes: ['name', 'unit']
            }
          ]
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error getting payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment',
      error: error.message
    });
  }
};

/**
 * Update payment
 * PUT /api/payments/:id
 */
exports.updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const payment = await db.Payment.findByPk(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const allowedFields = ['status', 'transactionId', 'notes', 'amount'];
    const updateData = {};

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = updates[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    await payment.update(updateData);

    const updatedPayment = await db.Payment.findByPk(id, {
      include: [
        {
          model: db.Reservation,
          as: 'reservation',
          include: [
            { model: db.Guest, as: 'guest', attributes: ['firstName', 'lastName'] }
          ]
        }
      ]
    });

    res.json({
      success: true,
      message: 'Payment updated successfully',
      data: updatedPayment
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment',
      error: error.message
    });
  }
};

/**
 * Delete payment
 * DELETE /api/payments/:id
 */
exports.deletePayment = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;

    const payment = await db.Payment.findByPk(id, { transaction });

    if (!payment) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const reservationId = payment.reservationId;

    // Delete payment
    await payment.destroy({ transaction });

    // Recalculate reservation payment status
    const payments = await db.Payment.findAll({
      where: {
        reservationId,
        status: 'completed'
      },
      transaction
    });

    const reservation = await db.Reservation.findByPk(reservationId, { transaction });

    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const totalAmount = parseFloat(reservation.totalAmount);

    let newPaymentStatus = 'not_paid';
    if (totalPaid >= totalAmount) {
      newPaymentStatus = 'full_payment';
    } else if (totalPaid > 0) {
      newPaymentStatus = 'advance_payment';
    }

    await reservation.update({ paymentStatus: newPaymentStatus }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment',
      error: error.message
    });
  }
};

module.exports = exports;
