/**
 * Calendar Routes
 * Calendar and availability endpoints
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { Reservation, Property } = require('../models');
const { Op } = require('sequelize');

/**
 * @swagger
 * /api/calendar/availability:
 *   get:
 *     summary: Get availability calendar
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 */
router.get('/availability', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate, propertyId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
        timestamp: new Date().toISOString()
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get all properties or specific property
    const properties = [
      { id: 'ground-floor', name: 'Ground Floor Unit' },
      { id: 'first-floor', name: 'First Floor Unit' }
    ];

    // Get reservations in date range
    const reservations = await Reservation.findAll({
      where: {
        [Op.and]: [
          {
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
            ]
          },
          {
            status: {
              [Op.notIn]: ['cancelled', 'no_show']
            }
          }
        ]
      },
      order: [['checkInDate', 'ASC']]
    });

    // Build calendar data
    const calendar = {};
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];

      calendar[dateStr] = properties.map(property => {
        // Check if property is booked on this date
        const booked = reservations.some(res => {
          const checkIn = new Date(res.checkInDate);
          const checkOut = new Date(res.checkOutDate);
          return currentDate >= checkIn && currentDate < checkOut &&
                 (!propertyId || res.propertyId === property.id);
        });

        return {
          propertyId: property.id,
          propertyName: property.name,
          date: dateStr,
          available: !booked,
          status: booked ? 'occupied' : 'available'
        };
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate summary
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const totalSlots = totalDays * properties.length;
    const occupiedSlots = Object.values(calendar).flat().filter(slot => !slot.available).length;
    const occupancyRate = totalSlots > 0 ? ((occupiedSlots / totalSlots) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        period: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          days: totalDays
        },
        calendar,
        summary: {
          totalProperties: properties.length,
          totalDays,
          totalSlots,
          occupiedSlots,
          availableSlots: totalSlots - occupiedSlots,
          occupancyRate: parseFloat(occupancyRate),
          occupancyRateFormatted: `${occupancyRate}%`
        },
        reservations: reservations.map(r => ({
          id: r.id,
          confirmationNumber: r.confirmationNumber,
          propertyId: r.propertyId,
          checkInDate: r.checkInDate,
          checkOutDate: r.checkOutDate,
          nights: r.nights,
          status: r.status
        }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Calendar availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar availability',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/calendar/events:
 *   get:
 *     summary: Get calendar events (reservations)
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 */
router.get('/events', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

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
          }
        ]
      },
      order: [['checkInDate', 'ASC']]
    });

    const events = reservations.map(r => ({
      id: r.id,
      title: `${r.confirmationNumber} - ${r.guestName || 'Guest'}`,
      start: r.checkInDate,
      end: r.checkOutDate,
      propertyId: r.propertyId,
      status: r.status,
      paymentStatus: r.paymentStatus,
      totalAmount: r.totalAmount,
      adults: r.adults,
      children: r.children,
      color: r.status === 'confirmed' ? '#28a745' :
             r.status === 'checked_in' ? '#007bff' :
             r.status === 'pending' ? '#ffc107' : '#6c757d'
    }));

    res.json({
      success: true,
      data: {
        events,
        count: events.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Calendar events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar events',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
