// backend/src/routes/inventoryRoutes.js
// Complete Inventory Management API Routes

const express = require('express');
const router = express.Router();
const { InventoryItem, StockTransaction } = require('../models');
const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');

// ===== INVENTORY ITEMS ENDPOINTS =====

// Get all inventory items with filtering
router.get('/items', async (req, res) => {
  try {
    const { 
      category, 
      status, 
      search,
      location,
      lowStock,
      sortBy = 'name',
      sortOrder = 'ASC'
    } = req.query;

    const where = {};
    
    // Apply filters
    if (category) {
      where.category = category;
    }
    
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }
    
    if (location) {
      where.location = location;
    }
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (lowStock === 'true') {
      where[Op.and] = [
        Sequelize.where(
          Sequelize.col('currentStock'),
          Op.lte,
          Sequelize.col('minStock')
        )
      ];
    }

    const items = await InventoryItem.findAll({
      where,
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          model: StockTransaction,
          as: 'transactions',
          limit: 5,
          order: [['transactionDate', 'DESC']],
          required: false
        }
      ]
    });

    // Calculate summary statistics
    const summary = {
      totalItems: items.length,
      activeItems: items.filter(i => i.isActive).length,
      lowStockItems: items.filter(i => i.currentStock <= i.minStock).length,
      outOfStockItems: items.filter(i => i.currentStock === 0).length,
      totalValue: items.reduce((sum, item) => {
        const value = (item.currentStock || 0) * (parseFloat(item.costPerUnit) || 0);
        return sum + value;
      }, 0)
    };

    res.json({
      success: true,
      data: {
        items,
        summary
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get inventory items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory items',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get single inventory item by ID
router.get('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const item = await InventoryItem.findByPk(id, {
      include: [
        {
          model: StockTransaction,
          as: 'transactions',
          order: [['transactionDate', 'DESC'], ['createdAt', 'DESC']],
          limit: 50
        }
      ]
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
        timestamp: new Date().toISOString()
      });
    }

    // Calculate item statistics
    const stats = {
      totalStockIn: 0,
      totalStockOut: 0,
      totalAdjustments: 0,
      totalPurchaseCost: 0,
      lastRestocked: null,
      lastUsed: null
    };

    if (item.transactions) {
      item.transactions.forEach(txn => {
        if (txn.transactionType === 'stock_in') {
          stats.totalStockIn += Math.abs(txn.quantity);
          stats.totalPurchaseCost += parseFloat(txn.totalCost || 0);
          if (!stats.lastRestocked || txn.transactionDate > stats.lastRestocked) {
            stats.lastRestocked = txn.transactionDate;
          }
        } else if (txn.transactionType === 'stock_out') {
          stats.totalStockOut += Math.abs(txn.quantity);
          if (!stats.lastUsed || txn.transactionDate > stats.lastUsed) {
            stats.lastUsed = txn.transactionDate;
          }
        } else if (txn.transactionType === 'adjustment') {
          stats.totalAdjustments += 1;
        }
      });
    }

    res.json({
      success: true,
      data: {
        item,
        stats
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory item',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Create new inventory item
router.post('/items', async (req, res) => {
  try {
    const {
      name,
      category,
      subcategory,
      description,
      sku,
      currentStock = 0,
      minStock = 5,
      maxStock,
      unit = 'pieces',
      costPerUnit,
      supplierName,
      supplierContact,
      location,
      expiryDate,
      barcode,
      notes
    } = req.body;

    // Validation
    if (!name || !category || !unit) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, category, unit',
        timestamp: new Date().toISOString()
      });
    }

    // Check for duplicate SKU
    if (sku) {
      const existingItem = await InventoryItem.findOne({ where: { sku } });
      if (existingItem) {
        return res.status(409).json({
          success: false,
          message: 'Item with this SKU already exists',
          timestamp: new Date().toISOString()
        });
      }
    }

    const newItem = await InventoryItem.create({
      name,
      category,
      subcategory,
      description,
      sku: sku || `SKU-${Date.now()}`,
      currentStock,
      minStock,
      maxStock,
      unit,
      costPerUnit,
      supplierName,
      supplierContact,
      location,
      expiryDate,
      barcode,
      notes,
      isActive: true,
      lastRestocked: currentStock > 0 ? new Date() : null
    });

    // Create initial stock transaction if currentStock > 0
    if (currentStock > 0) {
      await StockTransaction.create({
        inventoryItemId: newItem.id,
        transactionType: 'stock_in',
        quantity: currentStock,
        quantityBefore: 0,
        quantityAfter: currentStock,
        unitCost: costPerUnit || 0,
        totalCost: (currentStock * (costPerUnit || 0)),
        supplierName,
        reason: 'Initial stock entry',
        transactionDate: new Date(),
        performedBy: 'admin',
        notes: 'Initial stock when item was created'
      });
    }

    console.log(`✅ Created inventory item: ${name} (${newItem.id})`);

    res.status(201).json({
      success: true,
      data: newItem,
      message: 'Inventory item created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Create inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create inventory item',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Update inventory item
router.put('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const item = await InventoryItem.findByPk(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
        timestamp: new Date().toISOString()
      });
    }

    // Don't allow direct currentStock updates (use transactions instead)
    delete updateData.currentStock;

    await item.update(updateData);

    console.log(`✅ Updated inventory item: ${item.name} (${id})`);

    res.json({
      success: true,
      data: item,
      message: 'Inventory item updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory item',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Delete (archive) inventory item
router.delete('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;

    const item = await InventoryItem.findByPk(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
        timestamp: new Date().toISOString()
      });
    }

    if (permanent === 'true') {
      // Permanent deletion
      await item.destroy();
      console.log(`🗑️ Permanently deleted inventory item: ${item.name} (${id})`);
    } else {
      // Soft delete (archive)
      await item.update({ isActive: false });
      console.log(`📦 Archived inventory item: ${item.name} (${id})`);
    }

    res.json({
      success: true,
      message: permanent === 'true' ? 'Inventory item deleted permanently' : 'Inventory item archived',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Delete inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete inventory item',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===== STOCK TRANSACTION ENDPOINTS =====

// Stock IN (Purchase/Restock)
router.post('/items/:id/stock-in', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      quantity,
      unitCost,
      supplierName,
      invoiceNumber,
      transactionDate,
      notes,
      performedBy = 'admin'
    } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required',
        timestamp: new Date().toISOString()
      });
    }

    const item = await InventoryItem.findByPk(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
        timestamp: new Date().toISOString()
      });
    }

    const quantityBefore = item.currentStock;
    const quantityAfter = quantityBefore + parseInt(quantity);
    const cost = parseFloat(unitCost) || parseFloat(item.costPerUnit) || 0;
    const totalCost = quantity * cost;

    // Create transaction
    const transaction = await StockTransaction.create({
      inventoryItemId: id,
      transactionType: 'stock_in',
      quantity: parseInt(quantity),
      quantityBefore,
      quantityAfter,
      unitCost: cost,
      totalCost,
      supplierName: supplierName || item.supplierName,
      invoiceNumber,
      transactionDate: transactionDate || new Date(),
      performedBy,
      notes,
      isApproved: true,
      approvedBy: performedBy,
      approvedAt: new Date()
    });

    // Update item stock and last restocked date
    await item.update({
      currentStock: quantityAfter,
      lastRestocked: new Date(),
      costPerUnit: cost || item.costPerUnit // Update cost if provided
    });

    console.log(`📥 STOCK IN: ${quantity} ${item.unit} of ${item.name} (${quantityBefore} → ${quantityAfter})`);

    res.status(201).json({
      success: true,
      data: {
        transaction,
        item: await InventoryItem.findByPk(id)
      },
      message: 'Stock added successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stock IN error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add stock',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Stock OUT (Usage/Consumption)
router.post('/items/:id/stock-out', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      quantity,
      reason,
      usedBy,
      propertyId,
      reservationId,
      guestName,
      transactionDate,
      notes,
      performedBy = 'admin'
    } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required',
        timestamp: new Date().toISOString()
      });
    }

    const item = await InventoryItem.findByPk(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
        timestamp: new Date().toISOString()
      });
    }

    if (item.currentStock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${item.currentStock} ${item.unit}, Requested: ${quantity} ${item.unit}`,
        timestamp: new Date().toISOString()
      });
    }

    const quantityBefore = item.currentStock;
    const quantityAfter = quantityBefore - parseInt(quantity);

    // Create transaction
    const transaction = await StockTransaction.create({
      inventoryItemId: id,
      transactionType: 'stock_out',
      quantity: -parseInt(quantity), // Negative for stock out
      quantityBefore,
      quantityAfter,
      reason,
      usedBy,
      propertyId,
      reservationId,
      guestName,
      transactionDate: transactionDate || new Date(),
      performedBy,
      notes,
      isApproved: true,
      approvedBy: performedBy,
      approvedAt: new Date()
    });

    // Update item stock
    await item.update({
      currentStock: quantityAfter
    });

    console.log(`📤 STOCK OUT: ${quantity} ${item.unit} of ${item.name} (${quantityBefore} → ${quantityAfter})`);

    res.status(201).json({
      success: true,
      data: {
        transaction,
        item: await InventoryItem.findByPk(id),
        alert: quantityAfter <= item.minStock ? 'Low stock alert!' : null
      },
      message: 'Stock removed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stock OUT error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove stock',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Stock Adjustment (Manual correction)
router.post('/items/:id/adjust', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      newQuantity,
      reason,
      transactionDate,
      notes,
      performedBy = 'admin'
    } = req.body;

    if (newQuantity === undefined || newQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid new quantity is required',
        timestamp: new Date().toISOString()
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason for adjustment is required',
        timestamp: new Date().toISOString()
      });
    }

    const item = await InventoryItem.findByPk(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
        timestamp: new Date().toISOString()
      });
    }

    const quantityBefore = item.currentStock;
    const quantityAfter = parseInt(newQuantity);
    const quantityDiff = quantityAfter - quantityBefore;

    // Create transaction
    const transaction = await StockTransaction.create({
      inventoryItemId: id,
      transactionType: 'adjustment',
      quantity: quantityDiff,
      quantityBefore,
      quantityAfter,
      reason,
      transactionDate: transactionDate || new Date(),
      performedBy,
      notes,
      isApproved: true,
      approvedBy: performedBy,
      approvedAt: new Date()
    });

    // Update item stock
    await item.update({
      currentStock: quantityAfter
    });

    console.log(`⚙️ STOCK ADJUSTMENT: ${item.name} (${quantityBefore} → ${quantityAfter}, diff: ${quantityDiff > 0 ? '+' : ''}${quantityDiff})`);

    res.status(201).json({
      success: true,
      data: {
        transaction,
        item: await InventoryItem.findByPk(id)
      },
      message: 'Stock adjusted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stock adjustment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to adjust stock',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get all transactions (with filtering)
router.get('/transactions', async (req, res) => {
  try {
    const {
      itemId,
      type,
      startDate,
      endDate,
      performedBy,
      limit = 100
    } = req.query;

    const where = {};

    if (itemId) where.inventoryItemId = itemId;
    if (type) where.transactionType = type;
    if (performedBy) where.performedBy = performedBy;
    
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate[Op.gte] = startDate;
      if (endDate) where.transactionDate[Op.lte] = endDate;
    }

    const transactions = await StockTransaction.findAll({
      where,
      include: [
        {
          model: InventoryItem,
          as: 'inventoryItem',
          attributes: ['id', 'name', 'sku', 'unit', 'category']
        }
      ],
      order: [['transactionDate', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        transactions,
        count: transactions.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get low stock alerts
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const { sequelize } = require('../models');
    
    const lowStockItems = await InventoryItem.findAll({
      where: {
        currentStock: { [Op.lte]: sequelize.col('minStock') },
        isActive: true
      },
      order: [['currentStock', 'ASC']]
    });

    const outOfStockItems = lowStockItems.filter(item => item.currentStock === 0);
    const criticalItems = lowStockItems.filter(item => item.currentStock > 0 && item.currentStock <= item.minStock * 0.5);

    res.json({
      success: true,
      data: {
        lowStockItems,
        summary: {
          total: lowStockItems.length,
          outOfStock: outOfStockItems.length,
          critical: criticalItems.length
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get low stock alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock alerts',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get inventory dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const { sequelize } = require('../models');
    
    const allItems = await InventoryItem.findAll({
      where: { isActive: true }
    });

    const lowStockItems = allItems.filter(item => item.currentStock <= item.minStock);
    const outOfStockItems = allItems.filter(item => item.currentStock === 0);
    
    const totalValue = allItems.reduce((sum, item) => {
      return sum + (item.currentStock * (parseFloat(item.costPerUnit) || 0));
    }, 0);

    // Category breakdown
    const categoryBreakdown = {};
    allItems.forEach(item => {
      if (!categoryBreakdown[item.category]) {
        categoryBreakdown[item.category] = {
          count: 0,
          totalValue: 0,
          lowStock: 0
        };
      }
      categoryBreakdown[item.category].count++;
      categoryBreakdown[item.category].totalValue += item.currentStock * (parseFloat(item.costPerUnit) || 0);
      if (item.currentStock <= item.minStock) {
        categoryBreakdown[item.category].lowStock++;
      }
    });

    // Recent transactions
    const recentTransactions = await StockTransaction.findAll({
      include: [
        {
          model: InventoryItem,
          as: 'inventoryItem',
          attributes: ['id', 'name', 'unit']
        }
      ],
      order: [['transactionDate', 'DESC'], ['createdAt', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalItems: allItems.length,
          activeItems: allItems.length,
          lowStockItems: lowStockItems.length,
          outOfStockItems: outOfStockItems.length,
          totalValue: Math.round(totalValue)
        },
        categoryBreakdown,
        recentTransactions
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get inventory dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory dashboard',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===== STOCK TRANSACTION HISTORY & REPORTS =====

/**
 * Get transaction history for a specific inventory item
 */
router.get('/items/:id/transactions', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      startDate,
      endDate,
      transactionType,
      page = 1,
      limit = 50
    } = req.query;

    const where = { inventoryItemId: id };

    if (transactionType) {
      where.transactionType = transactionType;
    }

    if (startDate && endDate) {
      where.transactionDate = {
        [Sequelize.Op.between]: [startDate, endDate]
      };
    }

    const offset = (page - 1) * limit;

    const { count, rows: transactions } = await StockTransaction.findAndCountAll({
      where,
      include: [
        {
          model: InventoryItem,
          as: 'inventoryItem',
          attributes: ['id', 'name', 'unit', 'category']
        }
      ],
      order: [['transactionDate', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        transactions,
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
    console.error('Get transaction history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction history',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get all transactions (across all items) with filters
 */
router.get('/transactions', async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      transactionType,
      propertyId,
      performedBy,
      page = 1,
      limit = 100
    } = req.query;

    const where = {};

    if (transactionType) {
      where.transactionType = transactionType;
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (performedBy) {
      where.performedBy = performedBy;
    }

    if (startDate && endDate) {
      where.transactionDate = {
        [Sequelize.Op.between]: [startDate, endDate]
      };
    }

    const offset = (page - 1) * limit;

    const { count, rows: transactions } = await StockTransaction.findAndCountAll({
      where,
      include: [
        {
          model: InventoryItem,
          as: 'inventoryItem',
          attributes: ['id', 'name', 'unit', 'category']
        }
      ],
      order: [['transactionDate', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        transactions,
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
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get usage report by property/date range
 */
router.get('/reports/usage', async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      propertyId,
      category,
      groupBy = 'item' // item, property, category, date
    } = req.query;

    const where = {
      transactionType: 'stock_out'
    };

    if (startDate && endDate) {
      where.transactionDate = {
        [Sequelize.Op.between]: [startDate, endDate]
      };
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    const transactions = await StockTransaction.findAll({
      where,
      include: [
        {
          model: InventoryItem,
          as: 'inventoryItem',
          attributes: ['id', 'name', 'unit', 'category', 'costPerUnit'],
          where: category ? { category } : {}
        }
      ],
      order: [['transactionDate', 'DESC']]
    });

    // Group data based on groupBy parameter
    const report = {};

    transactions.forEach(transaction => {
      let key;
      
      switch (groupBy) {
        case 'property':
          key = transaction.propertyId || 'unassigned';
          break;
        case 'category':
          key = transaction.inventoryItem.category;
          break;
        case 'date':
          key = transaction.transactionDate;
          break;
        case 'item':
        default:
          key = `${transaction.inventoryItem.name} (${transaction.inventoryItem.id})`;
      }

      if (!report[key]) {
        report[key] = {
          totalQuantity: 0,
          totalCost: 0,
          transactions: []
        };
      }

      const quantity = Math.abs(transaction.quantity);
      const cost = quantity * (parseFloat(transaction.inventoryItem.costPerUnit) || 0);

      report[key].totalQuantity += quantity;
      report[key].totalCost += cost;
      report[key].transactions.push({
        date: transaction.transactionDate,
        quantity,
        reason: transaction.reason,
        usedBy: transaction.usedBy,
        guestName: transaction.guestName,
        reservationId: transaction.reservationId,
        notes: transaction.notes
      });
    });

    // Calculate totals
    const totals = {
      totalTransactions: transactions.length,
      totalQuantity: Object.values(report).reduce((sum, item) => sum + item.totalQuantity, 0),
      totalCost: Object.values(report).reduce((sum, item) => sum + item.totalCost, 0)
    };

    res.json({
      success: true,
      data: {
        report,
        totals,
        filters: {
          startDate,
          endDate,
          propertyId,
          category,
          groupBy
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get usage report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate usage report',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get stock movement summary for analytics
 */
router.get('/reports/stock-movement', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const transactions = await StockTransaction.findAll({
      where: {
        transactionDate: {
          [Sequelize.Op.gte]: startDate
        }
      },
      include: [
        {
          model: InventoryItem,
          as: 'inventoryItem',
          attributes: ['id', 'name', 'category']
        }
      ]
    });

    // Calculate daily movements
    const dailyMovement = {};
    const categoryMovement = {};
    
    transactions.forEach(trans => {
      const date = trans.transactionDate;
      const category = trans.inventoryItem.category;
      
      // Daily stats
      if (!dailyMovement[date]) {
        dailyMovement[date] = {
          stockIn: 0,
          stockOut: 0,
          adjustments: 0
        };
      }
      
      const quantity = Math.abs(trans.quantity);
      
      if (trans.transactionType === 'stock_in') {
        dailyMovement[date].stockIn += quantity;
      } else if (trans.transactionType === 'stock_out') {
        dailyMovement[date].stockOut += quantity;
      } else {
        dailyMovement[date].adjustments += quantity;
      }
      
      // Category stats
      if (!categoryMovement[category]) {
        categoryMovement[category] = {
          stockIn: 0,
          stockOut: 0,
          adjustments: 0
        };
      }
      
      if (trans.transactionType === 'stock_in') {
        categoryMovement[category].stockIn += quantity;
      } else if (trans.transactionType === 'stock_out') {
        categoryMovement[category].stockOut += quantity;
      } else {
        categoryMovement[category].adjustments += quantity;
      }
    });

    res.json({
      success: true,
      data: {
        dailyMovement,
        categoryMovement,
        period: {
          startDate,
          endDate: new Date(),
          days: parseInt(days)
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get stock movement report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate stock movement report',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
