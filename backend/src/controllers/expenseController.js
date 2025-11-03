const db = require('../database/db');

// Create expense
exports.createExpense = async (req, res) => {
  try {
    const {
      category,
      amount,
      description,
      date,
      vendor,
      paymentMethod,
      receiptNumber,
      notes
    } = req.body;

    if (!category || !amount || !description || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: category, amount, description, date'
      });
    }

    const result = await db.run(
      `INSERT INTO expenses (
        category, amount, description, date, vendor, 
        paymentMethod, receiptNumber, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [category, amount, description, date, vendor, paymentMethod, receiptNumber, notes]
    );

    const expense = await db.get('SELECT * FROM expenses WHERE id = ?', [result.lastID]);

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: expense
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expense',
      error: error.message
    });
  }
};

// Get all expenses
exports.getAllExpenses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      category,
      startDate,
      endDate,
      vendor
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    if (vendor) {
      whereClause += ' AND vendor LIKE ?';
      params.push(`%${vendor}%`);
    }

    if (startDate && endDate) {
      whereClause += ' AND DATE(date) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    const countQuery = `SELECT COUNT(*) as total FROM expenses ${whereClause}`;
    const { total } = await db.get(countQuery, params);

    const query = `
      SELECT * FROM expenses
      ${whereClause}
      ORDER BY date DESC
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), offset);

    const expenses = await db.all(query, params);

    res.json({
      success: true,
      data: expenses,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve expenses',
      error: error.message
    });
  }
};

// Get expense by ID
exports.getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await db.get('SELECT * FROM expenses WHERE id = ?', [id]);

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
    console.error('Error getting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve expense',
      error: error.message
    });
  }
};

// Update expense
exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const expense = await db.get('SELECT * FROM expenses WHERE id = ?', [id]);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    const allowedFields = ['category', 'amount', 'description', 'date', 'vendor', 'paymentMethod', 'receiptNumber', 'notes'];
    const updateFields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    values.push(id);

    await db.run(
      `UPDATE expenses SET ${updateFields.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    const updatedExpense = await db.get('SELECT * FROM expenses WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: updatedExpense
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense',
      error: error.message
    });
  }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await db.get('SELECT * FROM expenses WHERE id = ?', [id]);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    await db.run('DELETE FROM expenses WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense',
      error: error.message
    });
  }
};

// Get expense statistics
exports.getExpenseStats = async (req, res) => {
  try {
    const { year, month } = req.query;

    let dateFilter = '';
    const params = [];

    if (year && month) {
      dateFilter = "WHERE strftime('%Y', date) = ? AND strftime('%m', date) = ?";
      params.push(year, month.toString().padStart(2, '0'));
    } else if (year) {
      dateFilter = "WHERE strftime('%Y', date) = ?";
      params.push(year);
    }

    const stats = await db.all(
      `SELECT 
        category,
        SUM(amount) as total,
        COUNT(*) as count,
        AVG(amount) as average
       FROM expenses
       ${dateFilter}
       GROUP BY category
       ORDER BY total DESC`,
      params
    );

    const totalExpenses = await db.get(
      `SELECT SUM(amount) as total, COUNT(*) as count FROM expenses ${dateFilter}`,
      params
    );

    res.json({
      success: true,
      data: {
        byCategory: stats,
        total: totalExpenses.total || 0,
        count: totalExpenses.count || 0,
        period: { year, month }
      }
    });
  } catch (error) {
    console.error('Error getting expense stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve expense statistics',
      error: error.message
    });
  }
};
