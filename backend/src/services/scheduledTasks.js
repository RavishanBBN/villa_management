/**
 * Scheduled Tasks Service
 * Automates daily summaries, check-in reminders, payment reminders, and inventory alerts
 */
const cron = require('node-cron');
const Reservation = require('../models/Reservation');
const InventoryItem = require('../models/InventoryItem');
const notificationService = require('./notificationService');
const logger = require('./logger');

class ScheduledTasks {
  constructor() {
    this.tasks = [];
  }

  /**
   * Initialize all scheduled tasks
   */
  init() {
    logger.logInfo(null, 'Initializing scheduled tasks...');

    // Daily summary at 8 AM
    this.tasks.push(
      cron.schedule('0 8 * * *', () => this.sendDailySummary(), {
        timezone: 'Asia/Colombo'
      })
    );

    // Check-in reminders at 10 AM
    this.tasks.push(
      cron.schedule('0 10 * * *', () => this.sendCheckInReminders(), {
        timezone: 'Asia/Colombo'
      })
    );

    // Payment reminders at 9 AM
    this.tasks.push(
      cron.schedule('0 9 * * *', () => this.sendPaymentReminders(), {
        timezone: 'Asia/Colombo'
      })
    );

    // Inventory alerts at 7 AM
    this.tasks.push(
      cron.schedule('0 7 * * *', () => this.checkInventoryLevels(), {
        timezone: 'Asia/Colombo'
      })
    );

    // Every hour - check for urgent items
    this.tasks.push(
      cron.schedule('0 * * * *', () => this.checkUrgentItems(), {
        timezone: 'Asia/Colombo'
      })
    );

    logger.logInfo(null, `Scheduled ${this.tasks.length} automated tasks`);
  }

  /**
   * Send daily summary report
   */
  async sendDailySummary() {
    try {
      logger.logInfo(null, 'Generating daily summary...');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get today's check-ins
      const checkInsToday = await Reservation.countDocuments({
        'dates.checkIn': { $gte: today, $lt: tomorrow },
        status: { $in: ['confirmed', 'checked-in'] }
      });

      // Get today's check-outs
      const checkOutsToday = await Reservation.countDocuments({
        'dates.checkOut': { $gte: today, $lt: tomorrow },
        status: { $in: ['confirmed', 'checked-in'] }
      });

      // Current occupancy
      const currentOccupancy = await Reservation.countDocuments({
        status: 'checked-in'
      });

      // Upcoming reservations (next 7 days)
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const upcomingReservations = await Reservation.countDocuments({
        'dates.checkIn': { $gte: tomorrow, $lt: nextWeek },
        status: 'confirmed'
      });

      // Today's revenue
      const todayReservations = await Reservation.find({
        createdAt: { $gte: today, $lt: tomorrow }
      });
      const revenueToday = todayReservations.reduce(
        (sum, res) => sum + (res.pricing?.totalLKR || 0),
        0
      );

      // Pending payments
      const pendingPayments = await Reservation.countDocuments({
        paymentStatus: { $in: ['pending', 'partial'] },
        status: { $ne: 'cancelled' }
      });

      // Low stock items
      const lowStockItems = await InventoryItem.countDocuments({
        $expr: { $lte: ['$quantity', '$reorderLevel'] },
        status: 'active'
      });

      const summaryData = {
        checkInsToday,
        checkOutsToday,
        currentOccupancy,
        upcomingReservations,
        revenueToday,
        pendingPayments,
        lowStockItems
      };

      await notificationService.sendDailySummary(
        summaryData,
        process.env.ADMIN_EMAIL
      );

      logger.logInfo(null, 'Daily summary sent successfully');
    } catch (error) {
      logger.logError(null, `Daily summary failed: ${error.message}`);
    }
  }

  /**
   * Send check-in reminders for tomorrow's arrivals
   */
  async sendCheckInReminders() {
    try {
      logger.logInfo(null, 'Sending check-in reminders...');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const upcomingReservations = await Reservation.find({
        'dates.checkIn': { $gte: tomorrow, $lt: dayAfter },
        status: 'confirmed'
      });

      let sent = 0;
      for (const reservation of upcomingReservations) {
        try {
          await notificationService.sendCheckInReminder(reservation);
          sent++;
        } catch (error) {
          logger.logError(
            null,
            `Failed to send reminder for ${reservation.confirmationNumber}: ${error.message}`
          );
        }
      }

      logger.logInfo(null, `Sent ${sent} check-in reminders`);
    } catch (error) {
      logger.logError(null, `Check-in reminders failed: ${error.message}`);
    }
  }

  /**
   * Send payment reminders for pending payments
   */
  async sendPaymentReminders() {
    try {
      logger.logInfo(null, 'Sending payment reminders...');

      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      // Find reservations with pending payments that check-in within 7 days
      const pendingPayments = await Reservation.find({
        paymentStatus: { $in: ['pending', 'partial'] },
        'dates.checkIn': { $gte: today, $lt: nextWeek },
        status: { $ne: 'cancelled' }
      });

      let sent = 0;
      for (const reservation of pendingPayments) {
        try {
          await notificationService.sendPaymentReminder(reservation);
          sent++;
        } catch (error) {
          logger.logError(
            null,
            `Failed to send payment reminder for ${reservation.confirmationNumber}: ${error.message}`
          );
        }
      }

      logger.logInfo(null, `Sent ${sent} payment reminders`);
    } catch (error) {
      logger.logError(null, `Payment reminders failed: ${error.message}`);
    }
  }

  /**
   * Check inventory levels and send alerts
   */
  async checkInventoryLevels() {
    try {
      logger.logInfo(null, 'Checking inventory levels...');

      const lowStockItems = await InventoryItem.find({
        $expr: { $lte: ['$quantity', '$reorderLevel'] },
        status: 'active'
      });

      let sent = 0;
      for (const item of lowStockItems) {
        try {
          await notificationService.sendLowStockAlert(
            item,
            process.env.ADMIN_EMAIL
          );
          sent++;
        } catch (error) {
          logger.logError(
            null,
            `Failed to send low stock alert for ${item.itemName}: ${error.message}`
          );
        }
      }

      if (sent > 0) {
        logger.logInfo(null, `Sent ${sent} low stock alerts`);
      } else {
        logger.logInfo(null, 'All inventory levels are adequate');
      }
    } catch (error) {
      logger.logError(null, `Inventory check failed: ${error.message}`);
    }
  }

  /**
   * Check for urgent items (hourly)
   */
  async checkUrgentItems() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Check for same-day check-ins without payment
      const urgentPayments = await Reservation.countDocuments({
        'dates.checkIn': { $gte: today, $lt: tomorrow },
        paymentStatus: 'pending',
        status: 'confirmed'
      });

      if (urgentPayments > 0) {
        logger.logWarning(
          null,
          `⚠️ ${urgentPayments} same-day check-ins with pending payment`
        );
      }
    } catch (error) {
      logger.logError(null, `Urgent items check failed: ${error.message}`);
    }
  }

  /**
   * Stop all scheduled tasks
   */
  stopAll() {
    this.tasks.forEach(task => task.stop());
    logger.logInfo(null, 'All scheduled tasks stopped');
  }
}

module.exports = new ScheduledTasks();
