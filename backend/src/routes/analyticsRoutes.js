/**
 * Analytics Routes
 * Analytics and reporting endpoints
 */

const express = require('express');
const router = express.Router();
const { verifyToken, requirePermission } = require('../middleware/auth');
const dataStore = require('../services/dataStore');
const { Reservation, Payment, InventoryItem, Guest } = require('../models');
const { Op, Sequelize } = require('sequelize');

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get analytics dashboard data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 */
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    // Get reservation stats
    const totalReservations = await Reservation.count();
    const confirmedReservations = await Reservation.count({
      where: { status: 'confirmed' }
    });
    const checkedInReservations = await Reservation.count({
      where: { status: 'checked_in' }
    });

    // Monthly reservations
    const monthlyReservations = await Reservation.count({
      where: {
        createdAt: { [Op.gte]: thisMonth }
      }
    });

    // Revenue stats
    const totalRevenue = await Payment.sum('amount', {
      where: { status: 'completed' }
    }) || 0;

    const monthlyRevenue = await Payment.sum('amount', {
      where: {
        status: 'completed',
        paidAt: { [Op.gte]: thisMonth }
      }
    }) || 0;

    // Guest stats
    const totalGuests = await Guest.count();
    const vipGuests = await Guest.count({
      where: { isVip: true }
    });

    // Inventory stats
    const totalInventoryItems = await InventoryItem.count();
    const lowStockItems = await InventoryItem.count({
      where: Sequelize.where(
        Sequelize.col('current_stock'),
        Op.lte,
        Sequelize.col('min_stock')
      )
    });

    res.json({
      success: true,
      data: {
        reservations: {
          total: totalReservations,
          confirmed: confirmedReservations,
          checkedIn: checkedInReservations,
          monthly: monthlyReservations
        },
        revenue: {
          total: totalRevenue,
          monthly: monthlyRevenue,
          currency: 'LKR'
        },
        guests: {
          total: totalGuests,
          vip: vipGuests
        },
        inventory: {
          total: totalInventoryItems,
          lowStock: lowStockItems
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics dashboard',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/analytics/occupancy:
 *   get:
 *     summary: Get occupancy rate analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 */
router.get('/occupancy', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Calculate total available room-nights
    const totalProperties = 2; // Ground Floor + First Floor
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalRoomNights = totalProperties * days;

    // Calculate occupied room-nights
    const reservations = await Reservation.findAll({
      where: {
        [Op.or]: [
          {
            checkInDate: {
              [Op.between]: [start, end]
            }
          },
          {
            checkOutDate: {
              [Op.between]: [start, end]
            }
          },
          {
            [Op.and]: [
              { checkInDate: { [Op.lte]: start } },
              { checkOutDate: { [Op.gte]: end } }
            ]
          }
        ],
        status: {
          [Op.notIn]: ['cancelled', 'no_show']
        }
      }
    });

    let occupiedNights = 0;
    reservations.forEach(res => {
      const resStart = new Date(res.checkInDate) > start ? new Date(res.checkInDate) : start;
      const resEnd = new Date(res.checkOutDate) < end ? new Date(res.checkOutDate) : end;
      const nights = Math.ceil((resEnd - resStart) / (1000 * 60 * 60 * 24));
      occupiedNights += Math.max(0, nights);
    });

    const occupancyRate = totalRoomNights > 0 ? (occupiedNights / totalRoomNights * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        period: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          days
        },
        occupancy: {
          rate: parseFloat(occupancyRate),
          rateFormatted: `${occupancyRate}%`,
          totalRoomNights,
          occupiedNights,
          availableNights: totalRoomNights - occupiedNights
        },
        properties: {
          total: totalProperties,
          reservations: reservations.length
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Occupancy analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate occupancy rate',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/analytics/revenue:
 *   get:
 *     summary: Get revenue analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 */
router.get('/revenue', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const payments = await Payment.findAll({
      where: {
        status: 'completed',
        paidAt: {
          [Op.between]: [start, end]
        }
      },
      order: [['paidAt', 'ASC']]
    });

    const totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const averagePayment = payments.length > 0 ? totalRevenue / payments.length : 0;

    res.json({
      success: true,
      data: {
        period: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        },
        summary: {
          totalRevenue,
          totalTransactions: payments.length,
          averagePayment,
          currency: 'LKR'
        },
        payments: payments.map(p => ({
          id: p.id,
          amount: p.amount,
          currency: p.currency,
          method: p.method,
          paidAt: p.paidAt,
          reservationId: p.reservationId
        }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue analytics',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/analytics/guests:
 *   get:
 *     summary: Get guest analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 */
router.get('/guests', verifyToken, async (req, res) => {
  try {
    const guests = await Guest.findAll({
      attributes: ['country', 'nationality'],
      group: ['country', 'nationality']
    });

    const totalGuests = await Guest.count();
    const vipGuests = await Guest.count({ where: { isVip: true } });
    const blacklistedGuests = await Guest.count({ where: { blacklisted: true } });

    // Group by country
    const byCountry = {};
    guests.forEach(g => {
      const country = g.country || 'Unknown';
      byCountry[country] = (byCountry[country] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        summary: {
          total: totalGuests,
          vip: vipGuests,
          blacklisted: blacklistedGuests
        },
        byCountry,
        topCountries: Object.entries(byCountry)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([country, count]) => ({ country, count }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Guest analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch guest analytics',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
