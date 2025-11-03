/**
 * Revenue Management Routes
 * Track all revenue sources beyond reservations
 */
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const db = require('../models');

// GET /api/revenues - Get all revenue entries
router.get('/', async (req, res) => {
  try {
    const { 
      source, 
      propertyId, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 50 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const where = {};
    
    if (source) where.source = source;
    if (propertyId) where.propertyId = propertyId;
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = new Date(startDate);
      if (endDate) where.date[Op.lte] = new Date(endDate);
    }
    
    const { count, rows } = await db.Revenue.findAndCountAll({
      where,
      include: [{ 
        model: db.Property, 
        as: 'property',
        attributes: ['id', 'name', 'unit']
      }],
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: {
        revenues: rows,
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
      message: 'Failed to fetch revenues',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/revenues - Create new revenue entry
router.post('/', async (req, res) => {
  try {
    const { 
      description, 
      amount, 
      currency, 
      source, 
      propertyId, 
      date,
      notes 
    } = req.body;
    
    if (!description || !amount || !currency || !source) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: description, amount, currency, source'
      });
    }
    
    const revenue = await db.Revenue.create({
      description,
      amount: parseFloat(amount),
      currency,
      source,
      propertyId,
      date: date || new Date(),
      notes
    });
    
    const completeRevenue = await db.Revenue.findByPk(revenue.id, {
      include: [{ model: db.Property, as: 'property' }]
    });
    
    res.status(201).json({
      success: true,
      data: completeRevenue,
      message: 'Revenue entry created successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create revenue entry',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/revenues/:id - Get specific revenue entry
router.get('/:id', async (req, res) => {
  try {
    const revenue = await db.Revenue.findByPk(req.params.id, {
      include: [{ model: db.Property, as: 'property' }]
    });
    
    if (!revenue) {
      return res.status(404).json({
        success: false,
        message: 'Revenue entry not found'
      });
    }
    
    res.json({
      success: true,
      data: revenue
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue entry',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/revenues/:id - Update revenue entry
router.put('/:id', async (req, res) => {
  try {
    const revenue = await db.Revenue.findByPk(req.params.id);
    
    if (!revenue) {
      return res.status(404).json({
        success: false,
        message: 'Revenue entry not found'
      });
    }
    
    await revenue.update(req.body);
    
    const updatedRevenue = await db.Revenue.findByPk(revenue.id, {
      include: [{ model: db.Property, as: 'property' }]
    });
    
    res.json({
      success: true,
      data: updatedRevenue,
      message: 'Revenue entry updated successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update revenue entry',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/revenues/:id - Delete revenue entry
router.delete('/:id', async (req, res) => {
  try {
    const revenue = await db.Revenue.findByPk(req.params.id);
    
    if (!revenue) {
      return res.status(404).json({
        success: false,
        message: 'Revenue entry not found'
      });
    }
    
    await revenue.destroy();
    
    res.json({
      success: true,
      message: 'Revenue entry deleted successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete revenue entry',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/revenues/summary/monthly - Get monthly revenue summary
router.get('/summary/monthly', async (req, res) => {
  try {
    const { year, month } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    
    const revenues = await db.Revenue.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [{ model: db.Property, as: 'property' }]
    });
    
    const summary = {
      totalLKR: 0,
      totalUSD: 0,
      bySource: {},
      byProperty: {},
      count: revenues.length
    };
    
    revenues.forEach(rev => {
      const amount = parseFloat(rev.amount);
      
      if (rev.currency === 'LKR') {
        summary.totalLKR += amount;
      } else {
        summary.totalUSD += amount;
      }
      
      // By source
      const sourceKey = `${rev.source}_${rev.currency}`;
      summary.bySource[sourceKey] = (summary.bySource[sourceKey] || 0) + amount;
      
      // By property
      if (rev.property) {
        const propKey = `${rev.property.name}_${rev.currency}`;
        summary.byProperty[propKey] = (summary.byProperty[propKey] || 0) + amount;
      }
    });
    
    res.json({
      success: true,
      data: { revenues, summary }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate revenue summary',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
