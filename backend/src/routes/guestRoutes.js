/**
 * Guest Management Routes
 * Complete guest lifecycle management
 */
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const db = require('../models');

// GET /api/guests - Get all guests with filters
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      email, 
      country, 
      sortBy = 'createdAt', 
      order = 'DESC',
      page = 1, 
      limit = 50,
      include 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const where = {};
    
    // Search across multiple fields
    if (search) {
      where[Op.or] = [
        { bookerName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { country: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (email) {
      where.email = { [Op.like]: `%${email}%` };
    }
    
    if (country) {
      where.country = country;
    }
    
    const includeOptions = [];
    if (include && include.includes('reservations')) {
      includeOptions.push({
        model: db.Reservation,
        as: 'reservations',
        include: [{ model: db.Property, as: 'property' }]
      });
    }
    
    const { count, rows } = await db.Guest.findAndCountAll({
      where,
      include: includeOptions,
      order: [[sortBy, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: {
        guests: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch guests',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/guests - Create new guest
router.post('/', async (req, res) => {
  try {
    const guestData = req.body;
    
    // Check for duplicate email
    if (guestData.email) {
      const existing = await db.Guest.findOne({ 
        where: { email: guestData.email } 
      });
      
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Guest with this email already exists',
          existingGuest: existing,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    const guest = await db.Guest.create(guestData);
    
    res.status(201).json({
      success: true,
      data: guest,
      message: 'Guest created successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create guest',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/guests/:id - Get specific guest
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { include } = req.query;
    
    const includeOptions = [];
    if (include && include.includes('reservations')) {
      includeOptions.push({
        model: db.Reservation,
        as: 'reservations',
        include: [
          { model: db.Property, as: 'property' },
          { model: db.Payment, as: 'payments' }
        ],
        order: [['checkIn', 'DESC']]
      });
    }
    
    const guest = await db.Guest.findByPk(id, {
      include: includeOptions
    });
    
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Guest not found',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: guest,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch guest',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// PUT /api/guests/:id - Update guest
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const guest = await db.Guest.findByPk(id);
    
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Guest not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check email uniqueness if being updated
    if (updates.email && updates.email !== guest.email) {
      const existing = await db.Guest.findOne({
        where: { 
          email: updates.email,
          id: { [Op.ne]: id }
        }
      });
      
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Another guest with this email already exists',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    await guest.update(updates);
    
    res.json({
      success: true,
      data: guest,
      message: 'Guest updated successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update guest',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// DELETE /api/guests/:id - Soft delete guest
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const guest = await db.Guest.findByPk(id);
    
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Guest not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if guest has active reservations
    const activeReservations = await db.Reservation.count({
      where: {
        guestId: id,
        status: { [Op.in]: ['confirmed', 'checked_in'] }
      }
    });
    
    if (activeReservations > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete guest with active reservations',
        activeReservations,
        timestamp: new Date().toISOString()
      });
    }
    
    await guest.destroy();
    
    res.json({
      success: true,
      message: 'Guest deleted successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete guest',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/guests/:id/reservations - Get guest's reservations
router.get('/:id/reservations', async (req, res) => {
  try {
    const { id } = req.params;
    
    const guest = await db.Guest.findByPk(id);
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Guest not found',
        timestamp: new Date().toISOString()
      });
    }
    
    const reservations = await db.Reservation.findAll({
      where: { guestId: id },
      include: [
        { model: db.Property, as: 'property' },
        { model: db.Payment, as: 'payments' }
      ],
      order: [['checkIn', 'DESC']]
    });
    
    // Calculate statistics
    const stats = {
      totalReservations: reservations.length,
      upcomingReservations: reservations.filter(r => r.status === 'confirmed' && new Date(r.checkIn) > new Date()).length,
      completedReservations: reservations.filter(r => r.status === 'checked_out').length,
      cancelledReservations: reservations.filter(r => r.status === 'cancelled').length,
      totalSpentLKR: 0,
      totalSpentUSD: 0
    };
    
    reservations.forEach(r => {
      if (r.paymentCurrency === 'LKR') {
        stats.totalSpentLKR += parseFloat(r.totalPaid || 0);
      } else {
        stats.totalSpentUSD += parseFloat(r.totalPaid || 0);
      }
    });
    
    res.json({
      success: true,
      data: {
        guest,
        reservations,
        statistics: stats
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch guest reservations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
