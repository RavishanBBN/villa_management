// =====================================================================
// INVOICE SERVICE - PDF Generation
// =====================================================================

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class InvoiceService {
  constructor() {
    this.invoicesDir = path.join(__dirname, '../../uploads/invoices');
    // Create directory if it doesn't exist
    if (!fs.existsSync(this.invoicesDir)) {
      fs.mkdirSync(this.invoicesDir, { recursive: true });
    }
  }

  /**
   * Generate PDF invoice for a reservation
   */
  async generateReservationInvoice(reservation, invoice, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `${invoice.invoiceNumber}.pdf`;
        const filePath = path.join(this.invoicesDir, fileName);
        
        // Create PDF document
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Invoice ${invoice.invoiceNumber}`,
            Author: 'Halcyon Rest Management System'
          }
        });

        // Pipe to file
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Generate invoice content
        this._drawHeader(doc, invoice);
        this._drawInvoiceDetails(doc, invoice, reservation);
        this._drawBillingInfo(doc, invoice, reservation);
        this._drawLineItems(doc, invoice);
        this._drawTotals(doc, invoice);
        this._drawPaymentInfo(doc, invoice);
        this._drawFooter(doc, invoice);

        // Finalize PDF
        doc.end();

        stream.on('finish', () => {
          resolve({
            filePath,
            fileName,
            fileUrl: `/uploads/invoices/${fileName}`
          });
        });

        stream.on('error', reject);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Draw invoice header with logo and company info
   */
  _drawHeader(doc, invoice) {
    const headerHeight = 120;
    
    // Company Name
    doc.fontSize(28)
       .fillColor('#8B5CF6')
       .font('Helvetica-Bold')
       .text('HALCYON REST', 50, 50);
    
    doc.fontSize(10)
       .fillColor('#666666')
       .font('Helvetica')
       .text('Premium Villa Management', 50, 85);
    
    // Company Address
    if (invoice.issuedFromAddress) {
      doc.fontSize(9)
         .fillColor('#888888')
         .text(invoice.issuedFromAddress, 50, 100, { width: 200 });
    }

    // Invoice Title
    doc.fontSize(32)
       .fillColor('#2D3748')
       .font('Helvetica-Bold')
       .text('INVOICE', 350, 50, { align: 'right' });

    // Draw line
    doc.strokeColor('#E2E8F0')
       .lineWidth(2)
       .moveTo(50, headerHeight + 20)
       .lineTo(550, headerHeight + 20)
       .stroke();

    return headerHeight + 40;
  }

  /**
   * Draw invoice details (number, date, etc.)
   */
  _drawInvoiceDetails(doc, invoice, reservation) {
    const startY = 180;

    // Invoice details on the right
    doc.fontSize(10)
       .fillColor('#2D3748')
       .font('Helvetica-Bold')
       .text('Invoice Number:', 350, startY)
       .font('Helvetica')
       .fillColor('#4A5568')
       .text(invoice.invoiceNumber, 460, startY, { align: 'right' });

    doc.font('Helvetica-Bold')
       .fillColor('#2D3748')
       .text('Issue Date:', 350, startY + 20)
       .font('Helvetica')
       .fillColor('#4A5568')
       .text(new Date(invoice.issueDate).toLocaleDateString(), 460, startY + 20, { align: 'right' });

    if (invoice.dueDate) {
      doc.font('Helvetica-Bold')
         .fillColor('#2D3748')
         .text('Due Date:', 350, startY + 40)
         .font('Helvetica')
         .fillColor('#4A5568')
         .text(new Date(invoice.dueDate).toLocaleDateString(), 460, startY + 40, { align: 'right' });
    }

    if (reservation && reservation.confirmationNumber) {
      doc.font('Helvetica-Bold')
         .fillColor('#2D3748')
         .text('Booking Ref:', 350, startY + 60)
         .font('Helvetica')
         .fillColor('#4A5568')
         .text(reservation.confirmationNumber, 460, startY + 60, { align: 'right' });
    }

    return startY + 100;
  }

  /**
   * Draw billing information
   */
  _drawBillingInfo(doc, invoice, reservation) {
    const startY = 290;

    // Bill To section
    doc.fontSize(12)
       .fillColor('#2D3748')
       .font('Helvetica-Bold')
       .text('BILL TO:', 50, startY);

    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#4A5568')
       .text(invoice.issuedTo, 50, startY + 25);

    if (invoice.issuedToEmail) {
      doc.fontSize(10)
         .fillColor('#718096')
         .text(invoice.issuedToEmail, 50, startY + 45);
    }

    if (invoice.issuedToAddress) {
      doc.fontSize(9)
         .fillColor('#718096')
         .text(invoice.issuedToAddress, 50, startY + 60, { width: 200 });
    }

    // Reservation details on the right
    if (reservation) {
      doc.fontSize(12)
         .fillColor('#2D3748')
         .font('Helvetica-Bold')
         .text('RESERVATION DETAILS:', 350, startY);

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#4A5568')
         .text(`Check-in: ${new Date(reservation.checkInDate).toLocaleDateString()}`, 350, startY + 25)
         .text(`Check-out: ${new Date(reservation.checkOutDate).toLocaleDateString()}`, 350, startY + 45)
         .text(`Nights: ${reservation.nights}`, 350, startY + 65)
         .text(`Guests: ${reservation.adults} Adults, ${reservation.children} Children`, 350, startY + 85);
    }

    return startY + 130;
  }

  /**
   * Draw line items table
   */
  _drawLineItems(doc, invoice) {
    let startY = 430;

    // Table header
    doc.fontSize(10)
       .fillColor('#FFFFFF')
       .font('Helvetica-Bold');

    // Header background
    doc.rect(50, startY, 500, 25)
       .fillAndStroke('#8B5CF6', '#8B5CF6');

    // Header text
    doc.fillColor('#FFFFFF')
       .text('Description', 60, startY + 8, { width: 200 })
       .text('Quantity', 280, startY + 8, { width: 60, align: 'center' })
       .text('Rate', 360, startY + 8, { width: 80, align: 'right' })
       .text('Amount', 470, startY + 8, { width: 70, align: 'right' });

    startY += 25;

    // Line items
    doc.font('Helvetica')
       .fillColor('#2D3748');

    invoice.lineItems.forEach((item, index) => {
      const y = startY + (index * 30);
      
      // Alternate row background
      if (index % 2 === 0) {
        doc.rect(50, y, 500, 30)
           .fillAndStroke('#F7FAFC', '#E2E8F0');
      }

      doc.fillColor('#2D3748')
         .fontSize(10)
         .text(item.description, 60, y + 10, { width: 200 })
         .text(item.quantity.toString(), 280, y + 10, { width: 60, align: 'center' })
         .text(`${invoice.currency} ${parseFloat(item.rate).toFixed(2)}`, 360, y + 10, { width: 80, align: 'right' })
         .text(`${invoice.currency} ${parseFloat(item.amount).toFixed(2)}`, 470, y + 10, { width: 70, align: 'right' });
    });

    return startY + (invoice.lineItems.length * 30) + 20;
  }

  /**
   * Draw totals section
   */
  _drawTotals(doc, invoice) {
    const startY = 430 + (invoice.lineItems.length * 30) + 50;
    const labelX = 380;
    const valueX = 470;

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#4A5568');

    // Subtotal
    doc.text('Subtotal:', labelX, startY, { align: 'right', width: 80 })
       .font('Helvetica')
       .text(`${invoice.currency} ${parseFloat(invoice.subtotal).toFixed(2)}`, valueX, startY, { align: 'right', width: 70 });

    // Discount
    if (invoice.discountAmount > 0) {
      doc.font('Helvetica')
         .fillColor('#48BB78')
         .text('Discount:', labelX, startY + 20, { align: 'right', width: 80 })
         .text(`-${invoice.currency} ${parseFloat(invoice.discountAmount).toFixed(2)}`, valueX, startY + 20, { align: 'right', width: 70 });
    }

    // Tax
    if (invoice.taxAmount > 0) {
      doc.font('Helvetica')
         .fillColor('#4A5568')
         .text(`Tax (${invoice.taxRate}%):`, labelX, startY + 40, { align: 'right', width: 80 })
         .text(`${invoice.currency} ${parseFloat(invoice.taxAmount).toFixed(2)}`, valueX, startY + 40, { align: 'right', width: 70 });
    }

    // Total line
    doc.strokeColor('#E2E8F0')
       .lineWidth(1)
       .moveTo(370, startY + 65)
       .lineTo(550, startY + 65)
       .stroke();

    // Total
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2D3748')
       .text('TOTAL:', labelX, startY + 75, { align: 'right', width: 80 })
       .text(`${invoice.currency} ${parseFloat(invoice.total).toFixed(2)}`, valueX, startY + 75, { align: 'right', width: 70 });

    // Amount paid
    if (invoice.paidAmount > 0) {
      const balance = parseFloat(invoice.total) - parseFloat(invoice.paidAmount);
      
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#48BB78')
         .text('Amount Paid:', labelX, startY + 100, { align: 'right', width: 80 })
         .text(`${invoice.currency} ${parseFloat(invoice.paidAmount).toFixed(2)}`, valueX, startY + 100, { align: 'right', width: 70 });

      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor(balance > 0 ? '#E53E3E' : '#48BB78')
         .text('Balance Due:', labelX, startY + 125, { align: 'right', width: 80 })
         .text(`${invoice.currency} ${balance.toFixed(2)}`, valueX, startY + 125, { align: 'right', width: 70 });
    }

    return startY + 150;
  }

  /**
   * Draw payment information
   */
  _drawPaymentInfo(doc, invoice) {
    const startY = 680;

    if (invoice.paymentStatus === 'paid' && invoice.paymentDate) {
      // Payment stamp
      doc.fontSize(24)
         .fillColor('#48BB78')
         .font('Helvetica-Bold')
         .text('PAID', 50, startY, { align: 'center', width: 500 });

      doc.fontSize(10)
         .fillColor('#4A5568')
         .font('Helvetica')
         .text(`Paid on ${new Date(invoice.paymentDate).toLocaleDateString()}`, 50, startY + 30, { align: 'center', width: 500 });
    }

    // Notes
    if (invoice.notes) {
      doc.fontSize(9)
         .fillColor('#718096')
         .font('Helvetica')
         .text('Notes:', 50, startY + 60)
         .text(invoice.notes, 50, startY + 75, { width: 500 });
    }
  }

  /**
   * Draw footer
   */
  _drawFooter(doc, invoice) {
    const footerY = 750;

    doc.fontSize(8)
       .fillColor('#A0AEC0')
       .font('Helvetica')
       .text('Thank you for your business!', 50, footerY, { align: 'center', width: 500 });

    doc.fontSize(7)
       .text('This is a computer-generated invoice. No signature required.', 50, footerY + 15, { align: 'center', width: 500 });
  }

  /**
   * Calculate invoice totals from line items
   */
  calculateTotals(lineItems, taxRate = 0, discountAmount = 0) {
    const subtotal = lineItems.reduce((sum, item) => {
      return sum + (parseFloat(item.rate) * parseInt(item.quantity));
    }, 0);

    const taxAmount = (subtotal - discountAmount) * (taxRate / 100);
    const total = subtotal - discountAmount + taxAmount;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      discountAmount: parseFloat(discountAmount),
      total: parseFloat(total.toFixed(2))
    };
  }
}

module.exports = new InvoiceService();
