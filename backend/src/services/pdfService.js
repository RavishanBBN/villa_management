// backend/src/services/pdfService.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFService {
  generateInvoice(invoice, reservation, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(outputPath);

        doc.pipe(stream);

        // Header
        doc.fontSize(20).text('HALCYON REST', 50, 50);
        doc.fontSize(10).text('Villa Management', 50, 75);
        doc.fontSize(10).text('Sri Lanka', 50, 90);
        
        // Invoice title
        doc.fontSize(20).text('INVOICE', 400, 50, { align: 'right' });
        doc.fontSize(10).text(`#${invoice.invoiceNumber || reservation.confirmationNumber}`, 400, 75, { align: 'right' });
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 400, 90, { align: 'right' });

        // Line
        doc.moveTo(50, 120).lineTo(550, 120).stroke();

        // Customer details
        doc.fontSize(12).text('Bill To:', 50, 140);
        doc.fontSize(10).text(reservation.guestInfo.bookerName, 50, 160);
        doc.text(reservation.guestInfo.email, 50, 175);
        doc.text(reservation.guestInfo.phone || '', 50, 190);
        doc.text(reservation.guestInfo.country || '', 50, 205);

        // Booking details
        doc.fontSize(12).text('Booking Details:', 320, 140);
        doc.fontSize(10).text(`Confirmation: ${reservation.confirmationNumber}`, 320, 160);
        doc.text(`Check-in: ${reservation.dates.checkIn}`, 320, 175);
        doc.text(`Check-out: ${reservation.dates.checkOut}`, 320, 190);
        doc.text(`Nights: ${reservation.dates.nights}`, 320, 205);

        // Table header
        const tableTop = 250;
        doc.fontSize(10).text('Description', 50, tableTop);
        doc.text('Quantity', 300, tableTop);
        doc.text('Rate', 380, tableTop);
        doc.text('Amount', 480, tableTop, { align: 'right' });
        
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        // Table content
        let yPosition = tableTop + 30;
        doc.text(`${reservation.unitName}`, 50, yPosition);
        doc.text(`${reservation.dates.nights}`, 300, yPosition);
        doc.text(`LKR ${(reservation.pricing.totalLKR / reservation.dates.nights).toLocaleString()}`, 380, yPosition);
        doc.text(`LKR ${reservation.pricing.totalLKR.toLocaleString()}`, 480, yPosition, { align: 'right' });

        yPosition += 30;
        doc.text(`Guests: ${reservation.guestInfo.adults} Adults, ${reservation.guestInfo.children} Children`, 50, yPosition);

        // Total
        yPosition += 50;
        doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
        
        yPosition += 20;
        doc.fontSize(12).text('Subtotal:', 380, yPosition);
        doc.text(`LKR ${reservation.pricing.totalLKR.toLocaleString()}`, 480, yPosition, { align: 'right' });

        yPosition += 25;
        doc.fontSize(14).text('Total:', 380, yPosition, { bold: true });
        doc.text(`LKR ${reservation.pricing.totalLKR.toLocaleString()}`, 480, yPosition, { align: 'right', bold: true });

        // Payment status
        yPosition += 40;
        doc.fontSize(10).text(`Payment Status: ${reservation.paymentStatus?.toUpperCase() || 'PENDING'}`, 50, yPosition);

        // Footer
        doc.fontSize(8).text(
          'Thank you for choosing Halcyon Rest!',
          50,
          700,
          { align: 'center' }
        );
        doc.text(
          'For any queries, contact: info@halcyonrest.com | +94 77 123 4567',
          50,
          715,
          { align: 'center' }
        );

        doc.end();

        stream.on('finish', () => {
          resolve(outputPath);
        });

        stream.on('error', reject);

      } catch (error) {
        reject(error);
      }
    });
  }

  generateReceipt(payment, reservation, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(outputPath);

        doc.pipe(stream);

        // Header
        doc.fontSize(20).text('HALCYON REST', 50, 50);
        doc.fontSize(10).text('Payment Receipt', 50, 75);
        
        doc.fontSize(20).text('RECEIPT', 400, 50, { align: 'right' });
        doc.fontSize(10).text(`Date: ${new Date().toLocaleDateString()}`, 400, 75, { align: 'right' });

        doc.moveTo(50, 120).lineTo(550, 120).stroke();

        // Receipt details
        const yStart = 150;
        doc.fontSize(12).text('Receipt Details:', 50, yStart);
        doc.fontSize(10).text(`Confirmation: ${reservation.confirmationNumber}`, 50, yStart + 25);
        doc.text(`Guest: ${reservation.guestInfo.bookerName}`, 50, yStart + 45);
        doc.text(`Amount Paid: LKR ${payment.amount.toLocaleString()}`, 50, yStart + 65);
        doc.text(`Payment Method: ${payment.method}`, 50, yStart + 85);
        doc.text(`Payment Date: ${new Date().toLocaleDateString()}`, 50, yStart + 105);

        // Large "PAID" stamp
        doc.fontSize(60)
           .fillColor('green')
           .text('PAID', 200, 350, { 
             align: 'center',
             opacity: 0.3
           });

        doc.fillColor('black');
        doc.fontSize(10).text(
          'This is a computer-generated receipt and does not require a signature.',
          50,
          700,
          { align: 'center' }
        );

        doc.end();

        stream.on('finish', () => resolve(outputPath));
        stream.on('error', reject);

      } catch (error) {
        reject(error);
      }
    });
  }

  async generateFinancialReport(reportData, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(outputPath);

        doc.pipe(stream);

        // Header
        doc.fontSize(20).text('FINANCIAL REPORT', 50, 50);
        doc.fontSize(10).text(`Period: ${reportData.period.startDate} to ${reportData.period.endDate}`, 50, 75);
        doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, 50, 90);

        doc.moveTo(50, 120).lineTo(550, 120).stroke();

        let yPos = 150;

        // Revenue Summary
        doc.fontSize(14).text('Revenue Summary', 50, yPos);
        yPos += 25;
        doc.fontSize(10).text(`Total Revenue: LKR ${reportData.revenue.total.toLocaleString()}`, 50, yPos);
        yPos += 20;
        doc.text(`Accommodation: LKR ${reportData.revenue.byType.accommodation.toLocaleString()}`, 70, yPos);
        yPos += 15;
        doc.text(`Services: LKR ${reportData.revenue.byType.services.toLocaleString()}`, 70, yPos);
        yPos += 15;
        doc.text(`Other: LKR ${reportData.revenue.byType.other.toLocaleString()}`, 70, yPos);

        yPos += 40;

        // Expense Summary
        doc.fontSize(14).text('Expense Summary', 50, yPos);
        yPos += 25;
        doc.fontSize(10).text(`Total Expenses: LKR ${reportData.expenses.total.toLocaleString()}`, 50, yPos);
        yPos += 20;

        Object.entries(reportData.expenses.byCategory).forEach(([category, amount]) => {
          doc.text(`${category.charAt(0).toUpperCase() + category.slice(1)}: LKR ${amount.toLocaleString()}`, 70, yPos);
          yPos += 15;
        });

        yPos += 40;

        // Profit/Loss
        doc.fontSize(14).text('Profit & Loss', 50, yPos);
        yPos += 25;
        doc.fontSize(12).text(`Gross Profit: LKR ${reportData.profit.gross.toLocaleString()}`, 50, yPos);
        yPos += 20;
        doc.text(`Profit Margin: ${reportData.profit.margin}%`, 50, yPos);

        doc.end();

        stream.on('finish', () => resolve(outputPath));
        stream.on('error', reject);

      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = new PDFService();
