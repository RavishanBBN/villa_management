/**
 * Export Routes
 * Handles PDF and CSV export endpoints
 */
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const ExportService = require('../services/exportService');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const db = require('../models');

// Ensure exports directory exists
const exportsDir = path.join(__dirname, '../../uploads/exports');
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
}

/**
 * @route   GET /api/export/invoice/:reservationId/pdf
 * @desc    Generate and download PDF invoice for a reservation
 * @access  Private (requires view_financial permission)
 */
router.get('/invoice/:reservationId/pdf', 
  authenticateToken, 
  checkPermission('view_financial'),
  async (req, res) => {
    try {
      const reservation = await db.Reservation.findByPk(req.params.reservationId, {
        include: [{ model: db.Property, as: 'property' }]
      });

      if (!reservation) {
        return res.status(404).json({ success: false, message: 'Reservation not found' });
      }

      const filename = `invoice-${reservation.confirmationNumber}-${Date.now()}.pdf`;
      const outputPath = path.join(exportsDir, filename);

      await ExportService.generateInvoicePDF(reservation, outputPath);

      res.download(outputPath, filename, (err) => {
        if (err) console.error('Download error:', err);
        // Clean up file after download
        setTimeout(() => {
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        }, 60000); // Delete after 1 minute
      });
    } catch (error) {
      console.error('Invoice PDF generation error:', error);
      res.status(500).json({ success: false, message: 'Failed to generate invoice PDF' });
    }
  }
);

/**
 * @route   GET /api/export/reservations/csv
 * @desc    Export all reservations to CSV
 * @access  Private (requires view_reservations permission)
 */
router.get('/reservations/csv',
  authenticateToken,
  checkPermission('view_reservations'),
  async (req, res) => {
    try {
      const { startDate, endDate, status } = req.query;
      
      const where = {};
      if (startDate && endDate) {
        where['dates.checkIn'] = { [db.Sequelize.Op.between]: [startDate, endDate] };
      }
      if (status) {
        where.status = status;
      }

      const reservations = await db.Reservation.findAll({ where });

      const filename = `reservations-${Date.now()}.csv`;
      const outputPath = path.join(exportsDir, filename);

      await ExportService.exportReservationsCSV(reservations, outputPath);

      res.download(outputPath, filename, (err) => {
        if (err) console.error('Download error:', err);
        setTimeout(() => {
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        }, 60000);
      });
    } catch (error) {
      console.error('Reservations CSV export error:', error);
      res.status(500).json({ success: false, message: 'Failed to export reservations' });
    }
  }
);

/**
 * @route   POST /api/export/financial/report/pdf
 * @desc    Generate financial report PDF
 * @access  Private (requires view_financial permission)
 */
router.post('/financial/report/pdf',
  authenticateToken,
  checkPermission('view_financial'),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.body;

      // Fetch revenue data
      const revenues = await db.Revenue.findAll({
        where: {
          date: { [db.Sequelize.Op.between]: [startDate, endDate] }
        }
      });

      // Fetch expense data
      const expenses = await db.Expense.findAll({
        where: {
          date: { [db.Sequelize.Op.between]: [startDate, endDate] }
        }
      });

      const totalRevenue = revenues.reduce((sum, r) => sum + parseFloat(r.amount), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const netProfit = totalRevenue - totalExpenses;

      const reportData = {
        startDate,
        endDate,
        totalRevenue,
        totalExpenses,
        netProfit,
        revenues: revenues.map(r => r.toJSON()),
        expenses: expenses.map(e => e.toJSON())
      };

      const filename = `financial-report-${Date.now()}.pdf`;
      const outputPath = path.join(exportsDir, filename);

      await ExportService.generateFinancialReportPDF(reportData, outputPath);

      res.download(outputPath, filename, (err) => {
        if (err) console.error('Download error:', err);
        setTimeout(() => {
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        }, 60000);
      });
    } catch (error) {
      console.error('Financial report PDF error:', error);
      res.status(500).json({ success: false, message: 'Failed to generate financial report' });
    }
  }
);

/**
 * @route   GET /api/export/financial/csv
 * @desc    Export financial transactions to CSV
 * @access  Private (requires view_financial permission)
 */
router.get('/financial/csv',
  authenticateToken,
  checkPermission('view_financial'),
  async (req, res) => {
    try {
      const { startDate, endDate, type } = req.query;
      
      const transactions = [];

      // Fetch revenues
      if (!type || type === 'revenue') {
        const revenues = await db.Revenue.findAll({
          where: startDate && endDate ? {
            date: { [db.Sequelize.Op.between]: [startDate, endDate] }
          } : {}
        });
        transactions.push(...revenues.map(r => ({ ...r.toJSON(), type: 'Revenue' })));
      }

      // Fetch expenses
      if (!type || type === 'expense') {
        const expenses = await db.Expense.findAll({
          where: startDate && endDate ? {
            date: { [db.Sequelize.Op.between]: [startDate, endDate] }
          } : {}
        });
        transactions.push(...expenses.map(e => ({ ...e.toJSON(), type: 'Expense' })));
      }

      const filename = `financial-transactions-${Date.now()}.csv`;
      const outputPath = path.join(exportsDir, filename);

      await ExportService.exportFinancialCSV(transactions, outputPath);

      res.download(outputPath, filename, (err) => {
        if (err) console.error('Download error:', err);
        setTimeout(() => {
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        }, 60000);
      });
    } catch (error) {
      console.error('Financial CSV export error:', error);
      res.status(500).json({ success: false, message: 'Failed to export financial data' });
    }
  }
);

/**
 * @route   GET /api/export/inventory/csv
 * @desc    Export inventory to CSV
 * @access  Private (requires view_inventory permission)
 */
router.get('/inventory/csv',
  authenticateToken,
  checkPermission('view_inventory'),
  async (req, res) => {
    try {
      const items = await db.InventoryItem.findAll();

      const filename = `inventory-${Date.now()}.csv`;
      const outputPath = path.join(exportsDir, filename);

      await ExportService.exportInventoryCSV(items, outputPath);

      res.download(outputPath, filename, (err) => {
        if (err) console.error('Download error:', err);
        setTimeout(() => {
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        }, 60000);
      });
    } catch (error) {
      console.error('Inventory CSV export error:', error);
      res.status(500).json({ success: false, message: 'Failed to export inventory' });
    }
  }
);

module.exports = router;
