/**
 * Expense Management Routes
 * Track all operational expenses
 */
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const db = require('../models');

// GET /api/expenses - Get all expenses
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      propertyId, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 50 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const where = {};
    
    if (category) where.category = category;
    if (propertyId) where.propertyId = propertyId;
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = new Date(startDate);
      if (endDate) where.date[Op.lte] = new Date(endDate);
    }
    
    const { count, rows } = await db.Expense.findAndCountAll({
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
        expenses: rows,
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
      message: 'Failed to fetch expenses',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/expenses - Create new expense
router.post('/', async (req, res) => {
  try {
    const { 
      description, 
      amount, 
      currency, 
      category, 
      propertyId, 
      date,
      vendor,
      invoiceNumber,
      notes 
    } = req.body;
    
    if (!description || !amount || !currency || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: description, amount, currency, category'
      });
    }
    
    const expense = await db.Expense.create({
      description,
      amount: parseFloat(amount),
      currency,
      category,
      propertyId,
      date: date || new Date(),
      vendor,
      invoiceNumber,
      notes
    });
    
    const completeExpense = await db.Expense.findByPk(expense.id, {
      include: [{ model: db.Property, as: 'property' }]
    });
    
    res.status(201).json({
      success: true,
      data: completeExpense,
      message: 'Expense created successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create expense',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/expenses/:id - Get specific expense
router.get('/:id', async (req, res) => {
  try {
    const expense = await db.Expense.findByPk(req.params.id, {
      include: [{ model: db.Property, as: 'property' }]
    });
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    res.json({
      success: true,
      data: expense
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/expenses/:id - Update expense
router.put('/:id', async (req, res) => {
  try {
    const expense = await db.Expense.findByPk(req.params.id);
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    await expense.update(req.body);
    
    const updatedExpense = await db.Expense.findByPk(expense.id, {
      include: [{ model: db.Property, as: 'property' }]
    });
    
    res.json({
      success: true,
      data: updatedExpense,
      message: 'Expense updated successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update expense',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', async (req, res) => {
  try {
    const expense = await db.Expense.findByPk(req.params.id);
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    await expense.destroy();
    
    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/expenses/summary/monthly - Get monthly expense summary
router.get('/summary/monthly', async (req, res) => {
  try {
    const { year, month } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    
    const expenses = await db.Expense.findAll({
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
      byCategory: {},
      byProperty: {},
      count: expenses.length
    };
    
    expenses.forEach(exp => {
      const amount = parseFloat(exp.amount);
      
      if (exp.currency === 'LKR') {
        summary.totalLKR += amount;
      } else {
        summary.totalUSD += amount;
      }
      
      // By category
      const catKey = `${exp.category}_${exp.currency}`;
      summary.byCategory[catKey] = (summary.byCategory[catKey] || 0) + amount;
      
      // By property
      if (exp.property) {
        const propKey = `${exp.property.name}_${exp.currency}`;
        summary.byProperty[propKey] = (summary.byProperty[propKey] || 0) + amount;
      }
    });
    
    res.json({
      success: true,
      data: { expenses, summary }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate expense summary',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
