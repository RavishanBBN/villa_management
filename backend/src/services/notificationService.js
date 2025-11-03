/**
 * Notification Service
 * Handles email and SMS notifications for important events
 */
const nodemailer = require('nodemailer');
const logger = require('./logger');

class NotificationService {
  constructor() {
    // Email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Twilio client (optional - only if valid credentials are provided)
    this.smsClient = null;
    this.twilioPhone = null;
    
    if (process.env.SMS_ENABLED === 'true' && 
        process.env.TWILIO_ACCOUNT_SID && 
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
      try {
        const twilio = require('twilio');
        this.smsClient = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        this.twilioPhone = process.env.TWILIO_PHONE_NUMBER;
        logger.logInfo(null, 'SMS service (Twilio) initialized');
      } catch (error) {
        logger.logWarning(null, `SMS service initialization failed: ${error.message}`);
      }
    } else {
      logger.logInfo(null, 'SMS service disabled - only email notifications will be sent');
    }
  }

  /**
   * Send email notification
   */
  async sendEmail({ to, subject, html, text, attachments = [] }) {
    try {
      const mailOptions = {
        from: `"Halcyon Rest" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text,
        attachments
      };

      const info = await this.emailTransporter.sendMail(mailOptions);
      logger.logInfo(null, `Email sent: ${info.messageId} to ${to}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.logError(null, `Email send failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMS(to, message) {
    try {
      if (!this.smsClient) {
        logger.logWarning(null, 'SMS not configured - skipping SMS notification');
        return { success: false, message: 'SMS not configured' };
      }

      const result = await this.smsClient.messages.create({
        body: message,
        from: this.twilioPhone,
        to
      });

      logger.logInfo(null, `SMS sent: ${result.sid} to ${to}`);
      return { success: true, sid: result.sid };
    } catch (error) {
      logger.logError(null, `SMS send failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send booking confirmation notification
   */
  async sendBookingConfirmation(reservation) {
    const emailHtml = `
      <h2>Booking Confirmation - Halcyon Rest</h2>
      <p>Dear ${reservation.guestInfo.bookerName},</p>
      <p>Your reservation has been confirmed!</p>
      
      <h3>Reservation Details:</h3>
      <ul>
        <li><strong>Confirmation Number:</strong> ${reservation.confirmationNumber}</li>
        <li><strong>Check-In:</strong> ${new Date(reservation.dates.checkIn).toLocaleDateString()}</li>
        <li><strong>Check-Out:</strong> ${new Date(reservation.dates.checkOut).toLocaleDateString()}</li>
        <li><strong>Nights:</strong> ${reservation.dates.nights}</li>
        <li><strong>Guests:</strong> ${reservation.guestInfo.adults} Adults, ${reservation.guestInfo.children} Children</li>
        <li><strong>Total Amount:</strong> LKR ${reservation.pricing.totalLKR.toLocaleString()}</li>
      </ul>
      
      <p>We look forward to welcoming you!</p>
      <p>Best regards,<br>Halcyon Rest Team</p>
    `;

    await this.sendEmail({
      to: reservation.guestInfo.email,
      subject: `Booking Confirmation - ${reservation.confirmationNumber}`,
      html: emailHtml
    });

    // Send SMS if phone number is available
    if (reservation.guestInfo.phone) {
      const smsMessage = `Halcyon Rest: Your booking is confirmed! Confirmation #${reservation.confirmationNumber}. Check-in: ${new Date(reservation.dates.checkIn).toLocaleDateString()}`;
      try {
        await this.sendSMS(reservation.guestInfo.phone, smsMessage);
      } catch (error) {
        // SMS is optional, don't throw error
        logger.logWarning(null, `SMS notification failed: ${error.message}`);
      }
    }
  }

  /**
   * Send check-in reminder
   */
  async sendCheckInReminder(reservation) {
    const emailHtml = `
      <h2>Check-In Reminder - Halcyon Rest</h2>
      <p>Dear ${reservation.guestInfo.bookerName},</p>
      <p>This is a reminder that your check-in is tomorrow!</p>
      
      <h3>Reservation Details:</h3>
      <ul>
        <li><strong>Confirmation Number:</strong> ${reservation.confirmationNumber}</li>
        <li><strong>Check-In Date:</strong> ${new Date(reservation.dates.checkIn).toLocaleDateString()}</li>
        <li><strong>Check-In Time:</strong> 2:00 PM</li>
      </ul>
      
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Safe travels!<br>Halcyon Rest Team</p>
    `;

    await this.sendEmail({
      to: reservation.guestInfo.email,
      subject: `Check-In Reminder - ${reservation.confirmationNumber}`,
      html: emailHtml
    });
  }

  /**
   * Send payment reminder
   */
  async sendPaymentReminder(reservation) {
    const emailHtml = `
      <h2>Payment Reminder - Halcyon Rest</h2>
      <p>Dear ${reservation.guestInfo.bookerName},</p>
      <p>We noticed that payment for your reservation is pending.</p>
      
      <h3>Reservation Details:</h3>
      <ul>
        <li><strong>Confirmation Number:</strong> ${reservation.confirmationNumber}</li>
        <li><strong>Amount Due:</strong> LKR ${reservation.pricing.totalLKR.toLocaleString()}</li>
        <li><strong>Payment Status:</strong> ${reservation.paymentStatus}</li>
      </ul>
      
      <p>Please complete your payment to confirm your reservation.</p>
      <p>Thank you,<br>Halcyon Rest Team</p>
    `;

    await this.sendEmail({
      to: reservation.guestInfo.email,
      subject: `Payment Reminder - ${reservation.confirmationNumber}`,
      html: emailHtml
    });
  }

  /**
   * Send inventory low stock alert
   */
  async sendLowStockAlert(item, adminEmail) {
    const emailHtml = `
      <h2>⚠️ Low Stock Alert - Halcyon Rest</h2>
      <p>The following inventory item is running low:</p>
      
      <h3>Item Details:</h3>
      <ul>
        <li><strong>Item:</strong> ${item.itemName}</li>
        <li><strong>Code:</strong> ${item.itemCode}</li>
        <li><strong>Current Quantity:</strong> ${item.quantity} ${item.unit}</li>
        <li><strong>Reorder Level:</strong> ${item.reorderLevel} ${item.unit}</li>
        <li><strong>Category:</strong> ${item.category}</li>
      </ul>
      
      <p>Please restock this item soon.</p>
      <p>Halcyon Rest Inventory System</p>
    `;

    await this.sendEmail({
      to: adminEmail || process.env.ADMIN_EMAIL,
      subject: `⚠️ Low Stock Alert: ${item.itemName}`,
      html: emailHtml
    });
  }

  /**
   * Send maintenance reminder
   */
  async sendMaintenanceReminder(task, adminEmail) {
    const emailHtml = `
      <h2>🔧 Maintenance Reminder - Halcyon Rest</h2>
      <p>The following maintenance task is due:</p>
      
      <h3>Task Details:</h3>
      <ul>
        <li><strong>Task:</strong> ${task.title}</li>
        <li><strong>Category:</strong> ${task.category}</li>
        <li><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</li>
        <li><strong>Priority:</strong> ${task.priority}</li>
        <li><strong>Description:</strong> ${task.description}</li>
      </ul>
      
      <p>Please complete this task as soon as possible.</p>
      <p>Halcyon Rest Maintenance System</p>
    `;

    await this.sendEmail({
      to: adminEmail || process.env.ADMIN_EMAIL,
      subject: `🔧 Maintenance Due: ${task.title}`,
      html: emailHtml
    });
  }

  /**
   * Send daily summary report
   */
  async sendDailySummary(summaryData, adminEmail) {
    const emailHtml = `
      <h2>📊 Daily Summary - Halcyon Rest</h2>
      <p>Here's your daily summary for ${new Date().toLocaleDateString()}:</p>
      
      <h3>Reservations:</h3>
      <ul>
        <li>Check-Ins Today: ${summaryData.checkInsToday}</li>
        <li>Check-Outs Today: ${summaryData.checkOutsToday}</li>
        <li>Currently Occupied: ${summaryData.currentOccupancy}</li>
        <li>Upcoming Reservations: ${summaryData.upcomingReservations}</li>
      </ul>
      
      <h3>Financial:</h3>
      <ul>
        <li>Revenue Today: LKR ${summaryData.revenueToday?.toLocaleString() || '0'}</li>
        <li>Pending Payments: ${summaryData.pendingPayments}</li>
      </ul>
      
      <h3>Inventory Alerts:</h3>
      <ul>
        <li>Low Stock Items: ${summaryData.lowStockItems}</li>
      </ul>
      
      <p>Halcyon Rest Management System</p>
    `;

    await this.sendEmail({
      to: adminEmail || process.env.ADMIN_EMAIL,
      subject: `📊 Daily Summary - ${new Date().toLocaleDateString()}`,
      html: emailHtml
    });
  }
}

module.exports = new NotificationService();
