/**
 * Message Management Routes
 * Internal messaging and communication system
 */
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const db = require('../models');

// GET /api/messages - Get all messages
router.get('/', async (req, res) => {
  try {
    const { 
      type, 
      priority, 
      read, 
      page = 1, 
      limit = 50 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const where = {};
    
    if (type) where.type = type;
    if (priority) where.priority = priority;
    if (read !== undefined) where.read = read === 'true';
    
    const { count, rows } = await db.Message.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: {
        messages: rows,
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
      message: 'Failed to fetch messages',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/messages - Create new message
router.post('/', async (req, res) => {
  try {
    const { title, content, type, priority, relatedId, relatedType } = req.body;
    
    if (!title || !content || !type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, content, type'
      });
    }
    
    const message = await db.Message.create({
      title,
      content,
      type,
      priority: priority || 'normal',
      relatedId,
      relatedType,
      read: false
    });
    
    res.status(201).json({
      success: true,
      data: message,
      message: 'Message created successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create message',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/messages/unread - Get unread messages
router.get('/unread', async (req, res) => {
  try {
    const messages = await db.Message.findAll({
      where: { read: false },
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: {
        messages,
        count: messages.length
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread messages',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/messages/:id - Get specific message
router.get('/:id', async (req, res) => {
  try {
    const message = await db.Message.findByPk(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    res.json({
      success: true,
      data: message
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch message',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/messages/:id/read - Mark message as read
router.put('/:id/read', async (req, res) => {
  try {
    const message = await db.Message.findByPk(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    await message.update({ read: true, readAt: new Date() });
    
    res.json({
      success: true,
      data: message,
      message: 'Message marked as read'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update message',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/messages/:id - Delete message
router.delete('/:id', async (req, res) => {
  try {
    const message = await db.Message.findByPk(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    await message.destroy();
    
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
