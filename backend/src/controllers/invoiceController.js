const db = require('../database/db');

// Create invoice
exports.createInvoice = async (req, res) => {
  try {
    const { reservationId } = req.body;

    if (!reservationId) {
      return res.status(400).json({
        success: false,
        message: 'reservationId is required'
      });
    }

    const reservation = await db.get(
      `SELECT r.*, g.* FROM reservations r
       LEFT JOIN guests g ON r.guestId = g.id
       WHERE r.id = ?`,
      [reservationId]
    );

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    const invoiceNumber = `INV-${Date.now()}`;
    const result = await db.run(
      `INSERT INTO invoices (reservationId, invoiceNumber, amount, status)
       VALUES (?, ?, ?, ?)`,
      [reservationId, invoiceNumber, reservation.totalAmount, 'pending']
    );

    const invoice = await db.get('SELECT * FROM invoices WHERE id = ?', [result.lastID]);

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create invoice',
      error: error.message
    });
  }
};

// Get all invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND i.status = ?';
      params.push(status);
    }

    const countQuery = `SELECT COUNT(*) as total FROM invoices i ${whereClause}`;
    const { total } = await db.get(countQuery, params);

    const query = `
      SELECT i.*, r.confirmationNumber, g.firstName || ' ' || g.lastName as guestName
      FROM invoices i
      LEFT JOIN reservations r ON i.reservationId = r.id
      LEFT JOIN guests g ON r.guestId = g.id
      ${whereClause}
      ORDER BY i.createdAt DESC
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), offset);

    const invoices = await db.all(query, params);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoices',
      error: error.message
    });
  }
};

// Get invoice by ID
exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await db.get(
      `SELECT i.*, r.*, g.firstName, g.lastName, g.email, g.phone
       FROM invoices i
       LEFT JOIN reservations r ON i.reservationId = r.id
       LEFT JOIN guests g ON r.guestId = g.id
       WHERE i.id = ?`,
      [id]
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Error getting invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoice',
      error: error.message
    });
  }
};

// Update invoice status
exports.updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const invoice = await db.get('SELECT * FROM invoices WHERE id = ?', [id]);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    await db.run(
      'UPDATE invoices SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    const updatedInvoice = await db.get('SELECT * FROM invoices WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: updatedInvoice
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update invoice',
      error: error.message
    });
  }
};

// Delete invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await db.get('SELECT * FROM invoices WHERE id = ?', [id]);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    await db.run('DELETE FROM invoices WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete invoice',
      error: error.message
    });
  }
};
