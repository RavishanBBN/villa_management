// backend/src/routes/exportRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, requirePermission } = require('../middleware/auth');
const pdfService = require('../services/pdfService');
const logger = require('../services/logger');
const path = require('path');
const fs = require('fs');

/**
 * @swagger
 * /api/export/reservations/csv:
 *   get:
 *     tags: [Export]
 *     summary: Export reservations to CSV
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
 *     responses:
 *       200:
 *         description: CSV file download
 */
router.get('/reservations/csv', verifyToken, requirePermission('view_reservations'), async (req, res) => {
  try {
    const { Reservation } = require('../models');
    const { Op } = require('sequelize');
    const { startDate, endDate } = req.query;

    let whereClause = {};
    if (startDate && endDate) {
      whereClause.checkInDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    const reservations = await Reservation.findAll({
      where: whereClause,
      order: [['checkInDate', 'DESC']]
    });

    // Generate CSV
    let csv = 'Confirmation Number,Guest Name,Email,Phone,Check-in,Check-out,Nights,Adults,Children,Property,Total Amount (LKR),Status,Payment Status\n';
    
    reservations.forEach(res => {
      csv += `${res.confirmationNumber},`;
      csv += `"${res.guestName || ''}",`;
      csv += `${res.guestEmail || ''},`;
      csv += `${res.guestPhone || ''},`;
      csv += `${res.checkInDate},`;
      csv += `${res.checkOutDate},`;
      csv += `${res.nights},`;
      csv += `${res.adults},`;
      csv += `${res.children || 0},`;
      csv += `${res.propertyId},`;
      csv += `${res.totalAmount},`;
      csv += `${res.status},`;
      csv += `${res.paymentStatus}\n`;
    });

    const filename = `reservations_${startDate || 'all'}_to_${endDate || 'now'}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);

    logger.info('Reservations exported to CSV', { 
      user: req.user.id, 
      count: reservations.length,
      filename 
    });

  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({
      success: false,
      message: 'Failed to export reservations',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/export/financial/csv:
 *   get:
 *     tags: [Export]
 *     summary: Export financial report to CSV
 *     security:
 *       - bearerAuth: []
 */
router.get('/financial/csv', verifyToken, requirePermission('view_financial'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const now = new Date();
    
    const calculatedStartDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const calculatedEndDate = endDate || now.toISOString().split('T')[0];

    // This would use your financial summary function from server.js
    // For now, creating a simple export structure
    
    let csv = 'Date,Type,Category,Description,Amount (LKR),Amount (USD),Payment Method,Status\n';
    
    // Add sample data structure - you'd fetch real data here
    csv += `${calculatedStartDate},Revenue,Accommodation,"Sample Revenue",100000,333.33,Cash,Completed\n`;
    csv += `${calculatedStartDate},Expense,Utilities,"Sample Expense",25000,83.33,Bank Transfer,Paid\n`;

    const filename = `financial_report_${calculatedStartDate}_to_${calculatedEndDate}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);

    logger.info('Financial report exported to CSV', { 
      user: req.user.id,
      period: { startDate: calculatedStartDate, endDate: calculatedEndDate },
      filename 
    });

  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({
      success: false,
      message: 'Failed to export financial report',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/export/invoice/{reservationId}:
 *   get:
 *     tags: [Export]
 *     summary: Generate and download invoice PDF
 *     security:
 *       - bearerAuth: []
 */
router.get('/invoice/:reservationId', verifyToken, async (req, res) => {
  try {
    const { Reservation } = require('../models');
    const { reservationId } = req.params;

    const reservation = await Reservation.findByPk(reservationId);
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    // Create uploads/invoices directory if it doesn't exist
    const invoiceDir = path.join(__dirname, '../../uploads/invoices');
    if (!fs.existsSync(invoiceDir)) {
      fs.mkdirSync(invoiceDir, { recursive: true });
    }

    const filename = `invoice_${reservation.confirmationNumber}.pdf`;
    const outputPath = path.join(invoiceDir, filename);

    // Generate PDF
    const invoice = {
      invoiceNumber: reservation.confirmationNumber,
      date: new Date().toLocaleDateString()
    };

    const reservationData = {
      confirmationNumber: reservation.confirmationNumber,
      unitName: reservation.propertyId,
      guestInfo: {
        bookerName: reservation.guestName,
        email: reservation.guestEmail,
        phone: reservation.guestPhone,
        country: reservation.guestCountry
      },
      dates: {
        checkIn: reservation.checkInDate,
        checkOut: reservation.checkOutDate,
        nights: reservation.nights
      },
      pricing: {
        totalLKR: reservation.totalAmount
      },
      paymentStatus: reservation.paymentStatus
    };

    await pdfService.generateInvoice(invoice, reservationData, outputPath);

    // Send file
    res.download(outputPath, filename, (err) => {
      if (err) {
        logger.logError(err, req);
      }
      // Optional: Delete file after download
      // fs.unlinkSync(outputPath);
    });

    logger.info('Invoice PDF generated', { 
      user: req.user.id,
      reservation: reservation.confirmationNumber,
      filename 
    });

  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/export/receipt/{reservationId}:
 *   post:
 *     tags: [Export]
 *     summary: Generate payment receipt PDF
 *     security:
 *       - bearerAuth: []
 */
router.post('/receipt/:reservationId', verifyToken, async (req, res) => {
  try {
    const { Reservation } = require('../models');
    const { reservationId } = req.params;
    const { amount, method } = req.body;

    const reservation = await Reservation.findByPk(reservationId);
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    const receiptDir = path.join(__dirname, '../../uploads/receipts');
    if (!fs.existsSync(receiptDir)) {
      fs.mkdirSync(receiptDir, { recursive: true });
    }

    const filename = `receipt_${reservation.confirmationNumber}_${Date.now()}.pdf`;
    const outputPath = path.join(receiptDir, filename);

    const payment = {
      amount: amount || reservation.totalAmount,
      method: method || 'cash'
    };

    const reservationData = {
      confirmationNumber: reservation.confirmationNumber,
      guestInfo: {
        bookerName: reservation.guestName
      }
    };

    await pdfService.generateReceipt(payment, reservationData, outputPath);

    res.download(outputPath, filename);

    logger.info('Receipt PDF generated', { 
      user: req.user.id,
      reservation: reservation.confirmationNumber,
      amount: payment.amount,
      filename 
    });

  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({
      success: false,
      message: 'Failed to generate receipt',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/export/inventory/csv:
 *   get:
 *     tags: [Export]
 *     summary: Export inventory to CSV
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file download
 */
router.get('/inventory/csv', verifyToken, requirePermission('view_inventory'), async (req, res) => {
  try {
    const { InventoryItem } = require('../models');

    const items = await InventoryItem.findAll({
      order: [['category', 'ASC'], ['name', 'ASC']]
    });

    // Generate CSV
    let csv = 'SKU,Name,Category,Current Stock,Min Stock,Unit,Cost Per Unit,Location,Supplier,Status\n';

    items.forEach(item => {
      csv += `${item.sku || ''},`;
      csv += `"${item.name}",`;
      csv += `${item.category},`;
      csv += `${item.currentStock},`;
      csv += `${item.minStock},`;
      csv += `${item.unit},`;
      csv += `${item.costPerUnit || 0},`;
      csv += `"${item.location || ''}",`;
      csv += `"${item.supplier || ''}",`;
      csv += `${item.isActive ? 'Active' : 'Inactive'}\n`;
    });

    const filename = `inventory_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);

    logger.info('Inventory exported to CSV', {
      user: req.user.id,
      count: items.length,
      filename
    });

  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({
      success: false,
      message: 'Failed to export inventory',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/export/revenue/csv:
 *   get:
 *     summary: Export revenue data to CSV
 *     tags: [Export]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/revenue/csv', (req, res) => {
  const { startDate, endDate } = req.query;
  
  try {
    // Get revenue data (you'll need to import this from your main app or database)
    const revenueData = req.app.locals.revenueEntries || [];
    
    // Filter by date range if provided
    let filteredData = revenueData;
    if (startDate && endDate) {
      filteredData = revenueData.filter(r => 
        r.date >= startDate && r.date <= endDate
      );
    }
    
    // Generate CSV content
    const csvHeaders = [
      'ID', 'Date', 'Type', 'Description', 'Amount (LKR)', 'Amount (USD)', 
      'Payment Method', 'Status', 'Guest Name', 'Confirmation Number', 'Notes'
    ].join(',');
    
    const csvRows = filteredData.map(r => [
      r.id,
      r.date,
      r.type,
      `"${r.description}"`,
      r.amount,
      r.amountUSD.toFixed(2),
      r.paymentMethod,
      r.paymentStatus,
      `"${r.guestName || ''}"`,
      r.confirmationNumber || '',
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ].join(','));
    
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="revenue_${startDate || 'all'}_to_${endDate || 'now'}.csv"`);
    
    res.send(csvContent);
    
  } catch (error) {
    console.error('Revenue CSV export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export revenue data',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/export/expenses/csv:
 *   get:
 *     summary: Export expenses data to CSV
 *     tags: [Export]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CSV file download
 */
router.get('/expenses/csv', (req, res) => {
  const { startDate, endDate } = req.query;
  
  try {
    const expensesData = req.app.locals.financialExpenses || [];
    
    let filteredData = expensesData;
    if (startDate && endDate) {
      filteredData = expensesData.filter(e => 
        e.expenseDate >= startDate && e.expenseDate <= endDate
      );
    }
    
    const csvHeaders = [
      'ID', 'Date', 'Category', 'Subcategory', 'Description', 'Amount (LKR)', 
      'Amount (USD)', 'Vendor', 'Invoice Number', 'Status', 'Approved By', 'Notes'
    ].join(',');
    
    const csvRows = filteredData.map(e => [
      e.id,
      e.expenseDate,
      e.category,
      e.subcategory || '',
      `"${e.description}"`,
      e.amount,
      e.amountUSD.toFixed(2),
      `"${e.vendor}"`,
      e.invoiceNumber,
      e.status,
      e.approvedBy || '',
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ].join(','));
    
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="expenses_${startDate || 'all'}_to_${endDate || 'now'}.csv"`);
    
    res.send(csvContent);
    
  } catch (error) {
    console.error('Expenses CSV export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export expenses data',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/export/profit-loss/csv:
 *   get:
 *     summary: Export P&L statement to CSV
 *     tags: [Export]
 */
router.get('/profit-loss/csv', (req, res) => {
  const { startDate, endDate } = req.query;
  
  try {
    const revenueData = req.app.locals.revenueEntries || [];
    const expensesData = req.app.locals.financialExpenses || [];
    
    // Calculate totals
    const totalRevenue = revenueData
      .filter(r => (!startDate || r.date >= startDate) && (!endDate || r.date <= endDate))
      .reduce((sum, r) => sum + r.amount, 0);
    
    const totalExpenses = expensesData
      .filter(e => (!startDate || e.expenseDate >= startDate) && (!endDate || e.expenseDate <= endDate) && (e.status === 'approved' || e.status === 'paid'))
      .reduce((sum, e) => sum + e.amount, 0);
    
    const profit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : 0;
    
    // Generate P&L CSV
    const csvContent = [
      'Halcyon Rest - Profit & Loss Statement',
      `Period: ${startDate || 'All Time'} to ${endDate || 'Now'}`,
      '',
      'Category,Amount (LKR),Amount (USD)',
      `Total Revenue,${totalRevenue},${(totalRevenue / 300).toFixed(2)}`,
      `Total Expenses,${totalExpenses},${(totalExpenses / 300).toFixed(2)}`,
      `Net Profit,${profit},${(profit / 300).toFixed(2)}`,
      `Profit Margin,${profitMargin}%,${profitMargin}%`
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="profit_loss_${startDate || 'all'}_to_${endDate || 'now'}.csv"`);
    
    res.send(csvContent);
    
  } catch (error) {
    console.error('P&L CSV export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export P&L statement',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/export/summary/json:
 *   get:
 *     summary: Export complete financial summary as JSON
 *     tags: [Export]
 */
router.get('/summary/json', (req, res) => {
  const { startDate, endDate } = req.query;
  
  try {
    const revenueData = req.app.locals.revenueEntries || [];
    const expensesData = req.app.locals.financialExpenses || [];
    const reservationsData = req.app.locals.reservations || [];
    
    const summary = {
      period: {
        startDate: startDate || 'all',
        endDate: endDate || 'now',
        generatedAt: new Date().toISOString()
      },
      revenue: {
        total: revenueData.reduce((sum, r) => sum + r.amount, 0),
        count: revenueData.length,
        byType: {
          accommodation: revenueData.filter(r => r.type === 'accommodation').reduce((sum, r) => sum + r.amount, 0),
          services: revenueData.filter(r => r.type === 'services').reduce((sum, r) => sum + r.amount, 0),
          other: revenueData.filter(r => r.type === 'other').reduce((sum, r) => sum + r.amount, 0)
        }
      },
      expenses: {
        total: expensesData.filter(e => e.status === 'approved' || e.status === 'paid').reduce((sum, e) => sum + e.amount, 0),
        count: expensesData.length,
        byCategory: {
          utilities: expensesData.filter(e => e.category === 'utilities').reduce((sum, e) => sum + e.amount, 0),
          maintenance: expensesData.filter(e => e.category === 'maintenance').reduce((sum, e) => sum + e.amount, 0),
          supplies: expensesData.filter(e => e.category === 'supplies').reduce((sum, e) => sum + e.amount, 0),
          staff: expensesData.filter(e => e.category === 'staff').reduce((sum, e) => sum + e.amount, 0),
          marketing: expensesData.filter(e => e.category === 'marketing').reduce((sum, e) => sum + e.amount, 0),
          services: expensesData.filter(e => e.category === 'services').reduce((sum, e) => sum + e.amount, 0)
        }
      },
      reservations: {
        total: reservationsData.length,
        active: reservationsData.filter(r => r.status !== 'cancelled').length,
        byStatus: {
          confirmed: reservationsData.filter(r => r.status === 'confirmed').length,
          pending: reservationsData.filter(r => r.status === 'pending').length,
          cancelled: reservationsData.filter(r => r.status === 'cancelled').length
        }
      }
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="financial_summary_${Date.now()}.json"`);
    
    res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Summary JSON export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export financial summary',
      error: error.message
    });
  }
});

module.exports = router;
