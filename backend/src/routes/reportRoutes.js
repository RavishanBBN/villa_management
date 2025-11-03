/**
 * Reports Routes
 * Comprehensive business intelligence and reporting
 */
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const db = require('../models');

// GET /api/reports/financial - Financial report
router.get('/financial', async (req, res) => {
  try {
    const { startDate, endDate, propertyId } = req.query;
    
    const dateFilter = {};
    if (startDate) dateFilter[Op.gte] = new Date(startDate);
    if (endDate) dateFilter[Op.lte] = new Date(endDate);
    
    // Get payments
    const paymentWhere = {};
    if (startDate || endDate) paymentWhere.paidAt = dateFilter;
    
    const payments = await db.Payment.findAll({
      where: paymentWhere,
      include: [{
        model: db.Reservation,
        as: 'reservation',
        ...(propertyId && { where: { propertyId } })
      }]
    });
    
    // Get expenses
    const expenseWhere = {};
    if (startDate || endDate) expenseWhere.date = dateFilter;
    if (propertyId) expenseWhere.propertyId = propertyId;
    
    const expenses = await db.Expense.findAll({ where: expenseWhere });
    
    // Get revenues
    const revenueWhere = {};
    if (startDate || endDate) revenueWhere.date = dateFilter;
    if (propertyId) revenueWhere.propertyId = propertyId;
    
    const revenues = await db.Revenue.findAll({ where: revenueWhere });
    
    // Calculate totals
    const report = {
      period: { startDate, endDate },
      income: {
        paymentsLKR: payments.filter(p => p.currency === 'LKR').reduce((sum, p) => sum + parseFloat(p.amount), 0),
        paymentsUSD: payments.filter(p => p.currency === 'USD').reduce((sum, p) => sum + parseFloat(p.amount), 0),
        revenuesLKR: revenues.filter(r => r.currency === 'LKR').reduce((sum, r) => sum + parseFloat(r.amount), 0),
        revenuesUSD: revenues.filter(r => r.currency === 'USD').reduce((sum, r) => sum + parseFloat(r.amount), 0)
      },
      expenses: {
        totalLKR: expenses.filter(e => e.currency === 'LKR').reduce((sum, e) => sum + parseFloat(e.amount), 0),
        totalUSD: expenses.filter(e => e.currency === 'USD').reduce((sum, e) => sum + parseFloat(e.amount), 0)
      }
    };
    
    report.income.totalLKR = report.income.paymentsLKR + report.income.revenuesLKR;
    report.income.totalUSD = report.income.paymentsUSD + report.income.revenuesUSD;
    
    report.netProfitLKR = report.income.totalLKR - report.expenses.totalLKR;
    report.netProfitUSD = report.income.totalUSD - report.expenses.totalUSD;
    
    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate financial report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/reports/occupancy - Occupancy report
router.get('/occupancy', async (req, res) => {
  try {
    const { startDate, endDate, propertyId } = req.query;
    
    const where = {};
    if (propertyId) where.propertyId = propertyId;
    
    if (startDate || endDate) {
      where[Op.or] = [
        {
          checkIn: {
            [Op.between]: [new Date(startDate), new Date(endDate)]
          }
        },
        {
          checkOut: {
            [Op.between]: [new Date(startDate), new Date(endDate)]
          }
        }
      ];
    }
    
    const reservations = await db.Reservation.findAll({
      where,
      include: [{ model: db.Property, as: 'property' }]
    });
    
    const properties = await db.Property.findAll(propertyId ? { where: { id: propertyId } } : {});
    
    const report = {
      period: { startDate, endDate },
      totalReservations: reservations.length,
      byProperty: {},
      averageOccupancyRate: 0
    };
    
    properties.forEach(property => {
      const propReservations = reservations.filter(r => r.propertyId === property.id);
      const occupiedNights = propReservations.reduce((sum, r) => {
        const nights = Math.ceil((new Date(r.checkOut) - new Date(r.checkIn)) / (1000 * 60 * 60 * 24));
        return sum + nights;
      }, 0);
      
      const periodDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
      const occupancyRate = periodDays > 0 ? (occupiedNights / periodDays) * 100 : 0;
      
      report.byProperty[`${property.name} - ${property.unit}`] = {
        reservations: propReservations.length,
        occupiedNights,
        occupancyRate: Math.round(occupancyRate * 100) / 100
      };
    });
    
    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate occupancy report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/reports/revenue - Revenue report
router.get('/revenue', async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;
    
    const dateFilter = {};
    if (startDate) dateFilter[Op.gte] = new Date(startDate);
    if (endDate) dateFilter[Op.lte] = new Date(endDate);
    
    const payments = await db.Payment.findAll({
      where: { paidAt: dateFilter },
      include: [{
        model: db.Reservation,
        as: 'reservation',
        include: [{ model: db.Property, as: 'property' }]
      }],
      order: [['paidAt', 'ASC']]
    });
    
    const report = {
      period: { startDate, endDate },
      totalRevenueLKR: 0,
      totalRevenueUSD: 0,
      byPeriod: {},
      byProperty: {},
      byPaymentMethod: {}
    };
    
    payments.forEach(payment => {
      const amount = parseFloat(payment.amount);
      const currency = payment.currency;
      
      // Total
      if (currency === 'LKR') {
        report.totalRevenueLKR += amount;
      } else {
        report.totalRevenueUSD += amount;
      }
      
      // By payment method
      const methodKey = `${payment.method}_${currency}`;
      report.byPaymentMethod[methodKey] = (report.byPaymentMethod[methodKey] || 0) + amount;
      
      // By property
      if (payment.reservation?.property) {
        const propKey = `${payment.reservation.property.name}_${currency}`;
        report.byProperty[propKey] = (report.byProperty[propKey] || 0) + amount;
      }
      
      // By period
      const date = new Date(payment.paidAt);
      let periodKey;
      if (groupBy === 'day') {
        periodKey = date.toISOString().split('T')[0];
      } else if (groupBy === 'month') {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        periodKey = date.getFullYear().toString();
      }
      
      const periodCurrencyKey = `${periodKey}_${currency}`;
      report.byPeriod[periodCurrencyKey] = (report.byPeriod[periodCurrencyKey] || 0) + amount;
    });
    
    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate revenue report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/reports/guests - Guest analytics report
router.get('/guests', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }
    
    const guests = await db.Guest.findAll({
      where,
      include: [{
        model: db.Reservation,
        as: 'reservations',
        include: [{ model: db.Payment, as: 'payments' }]
      }]
    });
    
    const report = {
      totalGuests: guests.length,
      byCountry: {},
      topSpenders: [],
      repeatGuests: 0
    };
    
    const guestStats = guests.map(guest => {
      const reservationCount = guest.reservations?.length || 0;
      const totalSpent = guest.reservations?.reduce((sum, r) => {
        return sum + (r.payments?.reduce((pSum, p) => pSum + parseFloat(p.amount), 0) || 0);
      }, 0) || 0;
      
      // By country
      if (guest.country) {
        report.byCountry[guest.country] = (report.byCountry[guest.country] || 0) + 1;
      }
      
      // Repeat guests
      if (reservationCount > 1) {
        report.repeatGuests++;
      }
      
      return {
        id: guest.id,
        name: guest.bookerName,
        country: guest.country,
        reservations: reservationCount,
        totalSpent
      };
    });
    
    // Top 10 spenders
    report.topSpenders = guestStats
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
    
    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate guest report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/reports/monthly - Monthly comprehensive report
router.get('/monthly', async (req, res) => {
  try {
    const { month } = req.query; // Expected format: YYYY-MM

    if (!month) {
      return res.status(400).json({
        success: false,
        message: 'Month parameter is required (format: YYYY-MM)',
        timestamp: new Date().toISOString()
      });
    }

    const [year, monthNum] = month.split('-');
    const startDate = new Date(year, parseInt(monthNum) - 1, 1);
    const endDate = new Date(year, parseInt(monthNum), 0, 23, 59, 59); // Last day of month

    // Get all data for the month
    const reservations = await db.Reservation.findAll({
      where: {
        [Op.or]: [
          {
            checkInDate: {
              [Op.between]: [startDate, endDate]
            }
          },
          {
            checkOutDate: {
              [Op.between]: [startDate, endDate]
            }
          }
        ]
      },
      include: [
        { model: db.Guest, as: 'guest' },
        { model: db.Payment, as: 'payments' }
      ]
    });

    const payments = await db.Payment.findAll({
      where: {
        paidAt: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    // Calculate statistics
    const report = {
      period: {
        month,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      reservations: {
        total: reservations.length,
        byStatus: {
          confirmed: reservations.filter(r => r.status === 'confirmed').length,
          checked_in: reservations.filter(r => r.status === 'checked_in').length,
          checked_out: reservations.filter(r => r.status === 'checked_out').length,
          cancelled: reservations.filter(r => r.status === 'cancelled').length
        },
        totalNights: reservations.reduce((sum, r) => sum + (r.nights || 0), 0),
        totalGuests: reservations.reduce((sum, r) => sum + (r.adults || 0) + (r.children || 0), 0)
      },
      revenue: {
        totalLKR: payments.filter(p => p.currency === 'LKR').reduce((sum, p) => sum + parseFloat(p.amount), 0),
        totalUSD: payments.filter(p => p.currency === 'USD').reduce((sum, p) => sum + parseFloat(p.amount), 0),
        paymentCount: payments.length,
        byMethod: {
          cash: payments.filter(p => p.method === 'cash').length,
          card: payments.filter(p => p.method === 'card').length,
          bank_transfer: payments.filter(p => p.method === 'bank_transfer').length,
          online: payments.filter(p => p.method === 'online').length
        }
      },
      occupancy: {
        totalDays: endDate.getDate(),
        totalPossibleNights: endDate.getDate() * 2, // 2 properties
        bookedNights: reservations.reduce((sum, r) => sum + (r.nights || 0), 0),
        occupancyRate: 0
      }
    };

    report.occupancy.occupancyRate = report.occupancy.totalPossibleNights > 0
      ? ((report.occupancy.bookedNights / report.occupancy.totalPossibleNights) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate monthly report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
