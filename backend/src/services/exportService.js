/**
 * Export Service
 * Handles PDF and CSV export functionality for reports and documents
 */
const PDFDocument = require('pdfkit');
const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');
const fs = require('fs');

class ExportService {
  /**
   * Generate PDF Invoice
   */
  static async generateInvoicePDF(reservation, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const writeStream = fs.createWriteStream(outputPath);
        
        doc.pipe(writeStream);

        // Header
        doc.fontSize(20).text('HALCYON REST', { align: 'center' });
        doc.fontSize(12).text('Two Floor Villa - Sri Lanka', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text('INVOICE', { align: 'center' });
        doc.moveDown();

        // Invoice Details
        doc.fontSize(10);
        doc.text(`Invoice Number: ${reservation.confirmationNumber}`, 50, 150);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 50, 165);
        doc.text(`Status: ${reservation.status}`, 50, 180);

        // Guest Information
        doc.moveDown(2);
        doc.fontSize(12).text('Bill To:', 50, 220);
        doc.fontSize(10);
        doc.text(reservation.guestInfo.bookerName, 50, 240);
        doc.text(`Email: ${reservation.guestInfo.email}`, 50, 255);
        doc.text(`Phone: ${reservation.guestInfo.phone}`, 50, 270);

        // Reservation Details
        doc.fontSize(12).text('Reservation Details:', 50, 310);
        doc.fontSize(10);
        doc.text(`Check-In: ${new Date(reservation.dates.checkIn).toLocaleDateString()}`, 50, 330);
        doc.text(`Check-Out: ${new Date(reservation.dates.checkOut).toLocaleDateString()}`, 50, 345);
        doc.text(`Nights: ${reservation.dates.nights}`, 50, 360);
        doc.text(`Guests: ${reservation.guestInfo.adults} Adults, ${reservation.guestInfo.children} Children`, 50, 375);

        // Table Header
        const tableTop = 420;
        doc.fontSize(11).font('Helvetica-Bold');
        doc.text('Description', 50, tableTop);
        doc.text('Amount', 400, tableTop, { width: 100, align: 'right' });
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        // Table Content
        doc.font('Helvetica').fontSize(10);
        let yPos = tableTop + 25;
        
        doc.text(`Accommodation (${reservation.dates.nights} nights)`, 50, yPos);
        doc.text(`LKR ${reservation.pricing.totalLKR.toLocaleString()}`, 400, yPos, { width: 100, align: 'right' });
        
        if (reservation.pricing.totalUSD) {
          yPos += 20;
          doc.text(`(USD ${reservation.pricing.totalUSD.toFixed(2)})`, 400, yPos, { width: 100, align: 'right' });
        }

        // Total
        yPos += 40;
        doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
        yPos += 15;
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('TOTAL:', 50, yPos);
        doc.text(`LKR ${reservation.pricing.totalLKR.toLocaleString()}`, 400, yPos, { width: 100, align: 'right' });

        // Payment Status
        yPos += 30;
        doc.fontSize(10).font('Helvetica');
        doc.text(`Payment Status: ${reservation.paymentStatus}`, 50, yPos);

        // Footer
        doc.fontSize(8).text(
          'Thank you for choosing Halcyon Rest!',
          50,
          750,
          { align: 'center', width: 500 }
        );

        doc.end();
        
        writeStream.on('finish', () => resolve(outputPath));
        writeStream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate Financial Report PDF
   */
  static async generateFinancialReportPDF(data, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const writeStream = fs.createWriteStream(outputPath);
        
        doc.pipe(writeStream);

        // Header
        doc.fontSize(20).text('HALCYON REST', { align: 'center' });
        doc.fontSize(14).text('Financial Report', { align: 'center' });
        doc.fontSize(10).text(`Period: ${data.startDate} to ${data.endDate}`, { align: 'center' });
        doc.moveDown(2);

        // Summary
        doc.fontSize(12).font('Helvetica-Bold').text('Summary', 50);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Total Revenue: LKR ${data.totalRevenue.toLocaleString()}`, 70, doc.y + 10);
        doc.text(`Total Expenses: LKR ${data.totalExpenses.toLocaleString()}`, 70, doc.y + 5);
        doc.text(`Net Profit: LKR ${data.netProfit.toLocaleString()}`, 70, doc.y + 5);
        doc.moveDown(2);

        // Revenue Details
        if (data.revenues && data.revenues.length > 0) {
          doc.fontSize(12).font('Helvetica-Bold').text('Revenue Details', 50);
          doc.moveDown(0.5);
          
          const revenueTableTop = doc.y;
          doc.fontSize(9).font('Helvetica-Bold');
          doc.text('Date', 50, revenueTableTop);
          doc.text('Description', 120, revenueTableTop);
          doc.text('Amount', 450, revenueTableTop, { width: 100, align: 'right' });
          
          doc.moveTo(50, revenueTableTop + 12).lineTo(550, revenueTableTop + 12).stroke();
          
          let yPos = revenueTableTop + 20;
          doc.font('Helvetica').fontSize(8);
          
          data.revenues.slice(0, 15).forEach(rev => {
            doc.text(new Date(rev.date).toLocaleDateString(), 50, yPos);
            doc.text(rev.description.substring(0, 40), 120, yPos);
            doc.text(`LKR ${rev.amount.toLocaleString()}`, 450, yPos, { width: 100, align: 'right' });
            yPos += 15;
          });
        }

        doc.end();
        
        writeStream.on('finish', () => resolve(outputPath));
        writeStream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Export data to CSV
   */
  static async exportToCSV(data, headers, outputPath) {
    try {
      const csvWriter = createObjectCsvWriter({
        path: outputPath,
        header: headers
      });

      await csvWriter.writeRecords(data);
      return outputPath;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Export Reservations to CSV
   */
  static async exportReservationsCSV(reservations, outputPath) {
    const headers = [
      { id: 'confirmationNumber', title: 'Confirmation #' },
      { id: 'bookerName', title: 'Guest Name' },
      { id: 'email', title: 'Email' },
      { id: 'phone', title: 'Phone' },
      { id: 'checkIn', title: 'Check-In' },
      { id: 'checkOut', title: 'Check-Out' },
      { id: 'nights', title: 'Nights' },
      { id: 'adults', title: 'Adults' },
      { id: 'children', title: 'Children' },
      { id: 'totalLKR', title: 'Total (LKR)' },
      { id: 'status', title: 'Status' },
      { id: 'paymentStatus', title: 'Payment Status' }
    ];

    const csvData = reservations.map(res => ({
      confirmationNumber: res.confirmationNumber,
      bookerName: res.guestInfo.bookerName,
      email: res.guestInfo.email,
      phone: res.guestInfo.phone,
      checkIn: new Date(res.dates.checkIn).toLocaleDateString(),
      checkOut: new Date(res.dates.checkOut).toLocaleDateString(),
      nights: res.dates.nights,
      adults: res.guestInfo.adults,
      children: res.guestInfo.children,
      totalLKR: res.pricing.totalLKR,
      status: res.status,
      paymentStatus: res.paymentStatus
    }));

    return this.exportToCSV(csvData, headers, outputPath);
  }

  /**
   * Export Financial Transactions to CSV
   */
  static async exportFinancialCSV(transactions, outputPath) {
    const headers = [
      { id: 'date', title: 'Date' },
      { id: 'type', title: 'Type' },
      { id: 'category', title: 'Category' },
      { id: 'description', title: 'Description' },
      { id: 'amount', title: 'Amount (LKR)' },
      { id: 'status', title: 'Status' }
    ];

    const csvData = transactions.map(tx => ({
      date: new Date(tx.date).toLocaleDateString(),
      type: tx.type,
      category: tx.category || '',
      description: tx.description,
      amount: tx.amount,
      status: tx.status || tx.paymentStatus
    }));

    return this.exportToCSV(csvData, headers, outputPath);
  }

  /**
   * Export Inventory to CSV
   */
  static async exportInventoryCSV(items, outputPath) {
    const headers = [
      { id: 'itemCode', title: 'Item Code' },
      { id: 'itemName', title: 'Item Name' },
      { id: 'category', title: 'Category' },
      { id: 'quantity', title: 'Quantity' },
      { id: 'unit', title: 'Unit' },
      { id: 'reorderLevel', title: 'Reorder Level' },
      { id: 'unitPrice', title: 'Unit Price (LKR)' },
      { id: 'totalValue', title: 'Total Value (LKR)' },
      { id: 'status', title: 'Status' }
    ];

    const csvData = items.map(item => ({
      itemCode: item.itemCode,
      itemName: item.itemName,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      reorderLevel: item.reorderLevel,
      unitPrice: item.unitPrice,
      totalValue: item.quantity * item.unitPrice,
      status: item.quantity <= item.reorderLevel ? 'Low Stock' : 'OK'
    }));

    return this.exportToCSV(csvData, headers, outputPath);
  }
}

module.exports = ExportService;
