// =====================================================================
// INVOICE ROUTES - Invoice Generation, Storage, and Management
// =====================================================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const db = require('../models');
const invoiceService = require('../services/invoiceService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/invoices');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `invoice-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only images and PDFs allowed'));
  }
});

/* ==================== INVOICE GENERATION ==================== */

/**
 * @route   POST /api/invoices/generate/reservation/:reservationId
 * @desc    Generate invoice for a reservation
 * @access  Private
 */
router.post('/generate/reservation/:reservationId', async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { taxRate, discountAmount, additionalItems, notes } = req.body;

    // Get reservation with all details
    const reservation = await db.Reservation.findByPk(reservationId, {
      include: [
        { model: db.Property, as: 'property' },
        { model: db.Guest, as: 'guest' },
        { model: db.Payment, as: 'payments' }
      ]
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    // Build line items
    const lineItems = [
      {
        description: `${reservation.property.name} - ${reservation.nights} night(s)`,
        quantity: reservation.nights,
        rate: parseFloat(reservation.totalAmount) / reservation.nights,
        amount: parseFloat(reservation.totalAmount)
      }
    ];

    // Add additional items if provided
    if (additionalItems && Array.isArray(additionalItems)) {
      additionalItems.forEach(item => {
        lineItems.push({
          description: item.description,
          quantity: item.quantity || 1,
          rate: parseFloat(item.rate),
          amount: parseFloat(item.rate) * (item.quantity || 1)
        });
      });
    }

    // Calculate totals
    const totals = invoiceService.calculateTotals(
      lineItems,
      parseFloat(taxRate) || 0,
      parseFloat(discountAmount) || 0
    );

    // Calculate paid amount from payments
    const paidAmount = reservation.payments.reduce((sum, payment) => {
      if (payment.status === 'completed') {
        return sum + parseFloat(payment.amount);
      }
      return sum;
    }, 0);

    // Generate invoice number
    const invoiceNumber = await db.Invoice.generateInvoiceNumber();

    // Determine payment status
    let paymentStatus = 'unpaid';
    if (paidAmount >= totals.total) {
      paymentStatus = 'paid';
    } else if (paidAmount > 0) {
      paymentStatus = 'partially_paid';
    }

    // Create invoice record
    const invoice = await db.Invoice.create({
      invoiceNumber,
      type: 'guest_invoice',
      reservationId: reservation.id,
      issueDate: new Date(),
      dueDate: reservation.checkOutDate,
      issuedTo: reservation.guest.name,
      issuedToEmail: reservation.guest.email,
      issuedToAddress: `${reservation.guest.address || ''}\n${reservation.guest.city || ''}, ${reservation.guest.country || ''}`.trim(),
      issuedFrom: 'Halcyon Rest',
      issuedFromAddress: 'Colombo, Sri Lanka', // Update with actual address
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      taxRate: parseFloat(taxRate) || 0,
      discountAmount: totals.discountAmount,
      total: totals.total,
      currency: reservation.currency,
      exchangeRate: reservation.exchangeRate,
      lineItems,
      paymentStatus,
      paidAmount,
      paymentDate: paidAmount > 0 ? reservation.payments[0].paidAt : null,
      paymentMethod: paidAmount > 0 ? reservation.payments[0].method : null,
      notes,
      createdBy: req.body.createdBy || 'admin'
    });

    // Generate PDF
    const pdfResult = await invoiceService.generateReservationInvoice(reservation, invoice);

    // Update invoice with file path
    await invoice.update({
      filePath: pdfResult.filePath,
      fileUrl: pdfResult.fileUrl,
      originalFileName: pdfResult.fileName,
      fileSize: (await fs.stat(pdfResult.filePath)).size
    });

    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      data: {
        invoice,
        downloadUrl: pdfResult.fileUrl
      }
    });

  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/invoices/manual
 * @desc    Create manual invoice (not linked to reservation)
 * @access  Private
 */
router.post('/manual', async (req, res) => {
  try {
    const {
      type,
      issuedTo,
      issuedToEmail,
      issuedToAddress,
      lineItems,
      taxRate,
      discountAmount,
      currency,
      dueDate,
      notes,
      category,
      tags
    } = req.body;

    // Calculate totals
    const totals = invoiceService.calculateTotals(
      lineItems,
      parseFloat(taxRate) || 0,
      parseFloat(discountAmount) || 0
    );

    // Generate invoice number
    const invoiceNumber = await db.Invoice.generateInvoiceNumber();

    // Create invoice
    const invoice = await db.Invoice.create({
      invoiceNumber,
      type: type || 'other',
      issueDate: new Date(),
      dueDate: dueDate || null,
      issuedTo,
      issuedToEmail,
      issuedToAddress,
      issuedFrom: 'Halcyon Rest',
      issuedFromAddress: 'Colombo, Sri Lanka',
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      taxRate: parseFloat(taxRate) || 0,
      discountAmount: totals.discountAmount,
      total: totals.total,
      currency: currency || 'LKR',
      lineItems,
      paymentStatus: 'unpaid',
      paidAmount: 0,
      notes,
      category,
      tags: tags || [],
      createdBy: req.body.createdBy || 'admin'
    });

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: { invoice }
    });

  } catch (error) {
    console.error('Error creating manual invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create invoice',
      error: error.message
    });
  }
});

/* ==================== FILE UPLOAD ==================== */

/**
 * @route   POST /api/invoices/upload
 * @desc    Upload an invoice file
 * @access  Private
 */
router.post('/upload', upload.single('invoice'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const {
      type,
      reservationId,
      expenseId,
      issuedTo,
      issuedToEmail,
      amount,
      currency,
      issueDate,
      dueDate,
      category,
      tags,
      notes
    } = req.body;

    // Generate invoice number
    const invoiceNumber = await db.Invoice.generateInvoiceNumber();

    // Create invoice record
    const invoice = await db.Invoice.create({
      invoiceNumber,
      type: type || 'other',
      reservationId: reservationId || null,
      expenseId: expenseId || null,
      issueDate: issueDate || new Date(),
      dueDate: dueDate || null,
      issuedTo: issuedTo || 'N/A',
      issuedToEmail: issuedToEmail || null,
      issuedFrom: 'Halcyon Rest',
      subtotal: parseFloat(amount) || 0,
      taxAmount: 0,
      taxRate: 0,
      discountAmount: 0,
      total: parseFloat(amount) || 0,
      currency: currency || 'LKR',
      lineItems: [],
      paymentStatus: 'unpaid',
      paidAmount: 0,
      filePath: req.file.path,
      fileUrl: `/uploads/invoices/${req.file.filename}`,
      originalFileName: req.file.originalname,
      fileSize: req.file.size,
      category,
      tags: tags ? JSON.parse(tags) : [],
      notes,
      createdBy: req.body.createdBy || 'admin'
    });

    res.status(201).json({
      success: true,
      message: 'Invoice uploaded successfully',
      data: { invoice }
    });

  } catch (error) {
    console.error('Error uploading invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload invoice',
      error: error.message
    });
  }
});

/* ==================== INVOICE MANAGEMENT ==================== */

/**
 * @route   GET /api/invoices
 * @desc    Get all invoices with filters
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const {
      type,
      paymentStatus,
      reservationId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const where = {};
    
    if (type) where.type = type;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (reservationId) where.reservationId = reservationId;
    
    if (startDate && endDate) {
      where.issueDate = {
        [db.Sequelize.Op.between]: [startDate, endDate]
      };
    }

    if (search) {
      where[db.Sequelize.Op.or] = [
        { invoiceNumber: { [db.Sequelize.Op.iLike]: `%${search}%` } },
        { issuedTo: { [db.Sequelize.Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: invoices } = await db.Invoice.findAndCountAll({
      where,
      include: [
        { model: db.Reservation, as: 'reservation', attributes: ['confirmationNumber', 'checkInDate', 'checkOutDate'] }
      ],
      order: [['issueDate', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/invoices/:id
 * @desc    Get invoice by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const invoice = await db.Invoice.findByPk(req.params.id, {
      include: [
        {
          model: db.Reservation,
          as: 'reservation',
          include: [
            { model: db.Property, as: 'property' },
            { model: db.Guest, as: 'guest' },
            { model: db.Payment, as: 'payments' }
          ]
        }
      ]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: { invoice }
    });

  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/invoices/:id/payment
 * @desc    Record payment for invoice
 * @access  Private
 */
router.put('/:id/payment', async (req, res) => {
  try {
    const { amount, paymentMethod, paymentDate } = req.body;
    
    const invoice = await db.Invoice.findByPk(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    const newPaidAmount = parseFloat(invoice.paidAmount) + parseFloat(amount);
    const total = parseFloat(invoice.total);

    let paymentStatus = 'partially_paid';
    if (newPaidAmount >= total) {
      paymentStatus = 'paid';
    }

    await invoice.update({
      paidAmount: newPaidAmount,
      paymentStatus,
      paymentMethod: paymentMethod || invoice.paymentMethod,
      paymentDate: paymentDate || new Date()
    });

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: { invoice }
    });

  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/invoices/:id/void
 * @desc    Void an invoice
 * @access  Private
 */
router.put('/:id/void', async (req, res) => {
  try {
    const { reason } = req.body;
    
    const invoice = await db.Invoice.findByPk(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    await invoice.update({
      isVoided: true,
      voidedAt: new Date(),
      voidReason: reason,
      paymentStatus: 'cancelled'
    });

    res.json({
      success: true,
      message: 'Invoice voided successfully',
      data: { invoice }
    });

  } catch (error) {
    console.error('Error voiding invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to void invoice',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/invoices/:id
 * @desc    Delete invoice (soft delete - mark as voided)
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await db.Invoice.findByPk(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Soft delete - mark as voided
    await invoice.update({
      isVoided: true,
      voidedAt: new Date(),
      voidReason: 'Deleted by user'
    });

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
});

/**
 * @route   GET /api/invoices/:id/download
 * @desc    Download invoice PDF
 * @access  Private
 */
router.get('/:id/download', async (req, res) => {
  try {
    const invoice = await db.Invoice.findByPk(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (!invoice.filePath) {
      return res.status(404).json({
        success: false,
        message: 'Invoice file not found'
      });
    }

    res.download(invoice.filePath, invoice.originalFileName || `${invoice.invoiceNumber}.pdf`);

  } catch (error) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download invoice',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/invoices/:id/send
 * @desc    Send invoice via email
 * @access  Private
 */
router.post('/:id/send', async (req, res) => {
  try {
    const invoice = await db.Invoice.findByPk(req.params.id, {
      include: [
        {
          model: db.Reservation,
          as: 'reservation'
        }
      ]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (!invoice.issuedToEmail) {
      return res.status(400).json({
        success: false,
        message: 'Invoice has no email address'
      });
    }

    // Import email service
    const emailService = require('../services/emailService');

    // Send email with PDF attachment if available
    const result = await emailService.sendInvoiceEmail(
      invoice,
      invoice.filePath || null
    );

    // Update sent timestamp
    await invoice.update({
      sentAt: new Date()
    });

    res.json({
      success: true,
      message: `Invoice sent successfully to ${invoice.issuedToEmail}`,
      data: {
        messageId: result.messageId,
        sentTo: invoice.issuedToEmail,
        sentAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error sending invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invoice',
      error: error.message
    });
  }
});

module.exports = router;
