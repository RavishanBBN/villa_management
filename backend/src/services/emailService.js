const nodemailer = require('nodemailer');
const logger = require('./logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async sendEmail(to, subject, html, text = '') {
    try {
      const mailOptions = {
        from: `"Halcyon Rest" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully', { to, subject, messageId: info.messageId });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.logError(error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendPasswordResetEmail(email, resetToken, resetUrl) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏨 Halcyon Rest</h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>You requested to reset your password. Click the button below to reset it:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4CAF50;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Halcyon Rest. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(
      email,
      'Password Reset Request - Halcyon Rest',
      html,
      `Reset your password: ${resetUrl}`
    );
  }

  async sendBookingConfirmation(reservation) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .booking-details { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #4CAF50; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .label { font-weight: bold; color: #666; }
          .value { color: #333; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏨 Booking Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Dear ${reservation.guestInfo.bookerName},</h2>
            <p>Thank you for choosing Halcyon Rest! Your booking has been confirmed.</p>
            
            <div class="booking-details">
              <h3>Booking Details</h3>
              <div class="detail-row">
                <span class="label">Confirmation Number:</span>
                <span class="value">${reservation.confirmationNumber}</span>
              </div>
              <div class="detail-row">
                <span class="label">Property:</span>
                <span class="value">${reservation.unitName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Check-in:</span>
                <span class="value">${reservation.dates.checkIn}</span>
              </div>
              <div class="detail-row">
                <span class="label">Check-out:</span>
                <span class="value">${reservation.dates.checkOut}</span>
              </div>
              <div class="detail-row">
                <span class="label">Nights:</span>
                <span class="value">${reservation.dates.nights}</span>
              </div>
              <div class="detail-row">
                <span class="label">Guests:</span>
                <span class="value">${reservation.guestInfo.adults} Adults, ${reservation.guestInfo.children} Children</span>
              </div>
              <div class="detail-row">
                <span class="label">Total Amount:</span>
                <span class="value">LKR ${reservation.pricing.totalLKR.toLocaleString()}</span>
              </div>
            </div>

            <p><strong>Check-in Time:</strong> 2:00 PM<br>
            <strong>Check-out Time:</strong> 11:00 AM</p>

            <p>If you have any questions, please don't hesitate to contact us.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Halcyon Rest. All rights reserved.</p>
            <p>Email: info@halcyonrest.com | Phone: +94 77 123 4567</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(
      reservation.guestInfo.email,
      `Booking Confirmation - ${reservation.confirmationNumber}`,
      html
    );
  }

  async sendPaymentReceipt(reservation, payment) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .receipt { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #4CAF50; }
          .total { font-size: 20px; font-weight: bold; color: #4CAF50; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💳 Payment Receipt</h1>
          </div>
          <div class="content">
            <h2>Payment Received</h2>
            <p>Thank you for your payment!</p>

            <div class="receipt">
              <p><strong>Confirmation:</strong> ${reservation.confirmationNumber}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Amount Paid:</strong> LKR ${payment.amount.toLocaleString()}</p>
              <p><strong>Payment Method:</strong> ${payment.method}</p>
              <p class="total">Total: LKR ${payment.amount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(
      reservation.guestInfo.email,
      `Payment Receipt - ${reservation.confirmationNumber}`,
      html
    );
  }

  async sendInvoiceEmail(invoice, attachmentPath = null) {
    const formatCurrency = (amount, currency) => {
      return `${currency} ${parseFloat(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const balance = parseFloat(invoice.total) - parseFloat(invoice.paidAmount);
    const isPaid = invoice.paymentStatus === 'paid';
    const isOverdue = invoice.paymentStatus === 'overdue';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 650px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
          .header p { margin: 10px 0 0; font-size: 14px; opacity: 0.9; }
          .content { padding: 40px 30px; background: #ffffff; }
          .invoice-summary { background: #f7fafc; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #8b5cf6; }
          .invoice-details { margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
          .detail-row:last-child { border-bottom: none; }
          .label { font-weight: 600; color: #4a5568; }
          .value { color: #2d3748; font-weight: 500; }
          .total-row { font-size: 20px; font-weight: bold; color: #8b5cf6; padding-top: 15px; margin-top: 15px; border-top: 2px solid #8b5cf6; }
          .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
          .status-paid { background: #c6f6d5; color: #22543d; }
          .status-unpaid { background: #fed7d7; color: #742a2a; }
          .status-overdue { background: #fc8181; color: #742a2a; }
          .status-partial { background: #feebc8; color: #7c2d12; }
          .cta-button { display: inline-block; padding: 14px 32px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; transition: background 0.3s; }
          .cta-button:hover { background: #7c3aed; }
          .footer { text-align: center; padding: 30px; background: #f7fafc; color: #718096; font-size: 13px; border-radius: 0 0 8px 8px; }
          .footer p { margin: 5px 0; }
          .important-note { background: #fff5e6; border-left: 4px solid #ed8936; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .important-note p { margin: 0; color: #7c2d12; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 Invoice</h1>
            <p>From Halcyon Rest Villa Management</p>
          </div>

          <div class="content">
            <h2>Dear ${invoice.issuedTo},</h2>
            <p>Please find your invoice details below.</p>

            <div class="invoice-summary">
              <div class="invoice-details">
                <div class="detail-row">
                  <span class="label">Invoice Number:</span>
                  <span class="value">${invoice.invoiceNumber}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Issue Date:</span>
                  <span class="value">${formatDate(invoice.issueDate)}</span>
                </div>
                ${invoice.dueDate ? `
                <div class="detail-row">
                  <span class="label">Due Date:</span>
                  <span class="value">${formatDate(invoice.dueDate)}</span>
                </div>
                ` : ''}
                ${invoice.reservation?.confirmationNumber ? `
                <div class="detail-row">
                  <span class="label">Booking Reference:</span>
                  <span class="value">${invoice.reservation.confirmationNumber}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                  <span class="label">Status:</span>
                  <span class="value">
                    <span class="status-badge status-${invoice.paymentStatus === 'paid' ? 'paid' : invoice.paymentStatus === 'overdue' ? 'overdue' : invoice.paymentStatus === 'partially_paid' ? 'partial' : 'unpaid'}">
                      ${invoice.paymentStatus === 'paid' ? 'Paid' : invoice.paymentStatus === 'overdue' ? 'Overdue' : invoice.paymentStatus === 'partially_paid' ? 'Partially Paid' : 'Unpaid'}
                    </span>
                  </span>
                </div>
              </div>

              <div class="invoice-details">
                <div class="detail-row">
                  <span class="label">Subtotal:</span>
                  <span class="value">${formatCurrency(invoice.subtotal, invoice.currency)}</span>
                </div>
                ${parseFloat(invoice.discountAmount) > 0 ? `
                <div class="detail-row">
                  <span class="label">Discount:</span>
                  <span class="value" style="color: #48bb78;">-${formatCurrency(invoice.discountAmount, invoice.currency)}</span>
                </div>
                ` : ''}
                ${parseFloat(invoice.taxAmount) > 0 ? `
                <div class="detail-row">
                  <span class="label">Tax (${invoice.taxRate}%):</span>
                  <span class="value">${formatCurrency(invoice.taxAmount, invoice.currency)}</span>
                </div>
                ` : ''}
                <div class="detail-row total-row">
                  <span class="label">Total Amount:</span>
                  <span class="value">${formatCurrency(invoice.total, invoice.currency)}</span>
                </div>
                ${parseFloat(invoice.paidAmount) > 0 ? `
                <div class="detail-row">
                  <span class="label">Amount Paid:</span>
                  <span class="value" style="color: #48bb78;">${formatCurrency(invoice.paidAmount, invoice.currency)}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Balance Due:</span>
                  <span class="value" style="color: ${balance > 0 ? '#e53e3e' : '#48bb78'}; font-weight: bold;">${formatCurrency(balance, invoice.currency)}</span>
                </div>
                ` : ''}
              </div>
            </div>

            ${isPaid ? `
              <div style="text-align: center; margin: 30px 0;">
                <div style="font-size: 28px; color: #48bb78; font-weight: bold; margin-bottom: 10px;">✓ PAID</div>
                <p style="color: #4a5568;">Thank you for your payment!</p>
              </div>
            ` : isOverdue ? `
              <div class="important-note">
                <p><strong>⚠️ Payment Overdue:</strong> This invoice is past due. Please make payment as soon as possible to avoid late fees.</p>
              </div>
            ` : balance > 0 ? `
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/invoices/${invoice.id}" class="cta-button">
                  View Full Invoice
                </a>
              </div>
            ` : ''}

            ${invoice.notes ? `
              <div style="margin: 25px 0; padding: 20px; background: #f7fafc; border-radius: 6px;">
                <p style="margin: 0 0 10px; font-weight: 600; color: #2d3748;">Notes:</p>
                <p style="margin: 0; color: #4a5568;">${invoice.notes}</p>
              </div>
            ` : ''}

            ${attachmentPath ? `
              <p style="margin-top: 25px; color: #4a5568;">
                <strong>📎 Attachment:</strong> Please find the invoice PDF attached to this email.
              </p>
            ` : ''}

            <p style="margin-top: 30px;">If you have any questions about this invoice, please don't hesitate to contact us.</p>
          </div>

          <div class="footer">
            <p><strong>Halcyon Rest Villa Management</strong></p>
            <p>Email: info@halcyonrest.com | Phone: +94 77 123 4567</p>
            <p style="margin-top: 15px; font-size: 11px;">© ${new Date().getFullYear()} Halcyon Rest. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Halcyon Rest" <${process.env.EMAIL_USER}>`,
      to: invoice.issuedToEmail,
      subject: `Invoice ${invoice.invoiceNumber} - Halcyon Rest`,
      html
    };

    // Add attachment if PDF path is provided
    if (attachmentPath) {
      mailOptions.attachments = [{
        filename: `${invoice.invoiceNumber}.pdf`,
        path: attachmentPath
      }];
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Invoice email sent successfully', {
        to: invoice.issuedToEmail,
        invoiceNumber: invoice.invoiceNumber,
        messageId: info.messageId
      });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.logError(error);
      throw new Error(`Failed to send invoice email: ${error.message}`);
    }
  }

  async sendEmailVerification(email, userName, verificationToken, verificationUrl) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 600px;
            margin: 30px auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 600;
            letter-spacing: 1px;
          }
          .content {
            padding: 40px 30px;
            background: white;
          }
          .content h2 {
            color: #2d3748;
            font-size: 24px;
            margin-top: 0;
            margin-bottom: 20px;
          }
          .content p {
            color: #4a5568;
            font-size: 16px;
            line-height: 1.8;
            margin: 15px 0;
          }
          .verification-box {
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            border-left: 4px solid #8b5cf6;
            padding: 25px;
            margin: 30px 0;
            border-radius: 4px;
          }
          .button-container {
            text-align: center;
            margin: 35px 0;
          }
          .button {
            display: inline-block;
            padding: 16px 40px;
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            letter-spacing: 0.5px;
            box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3);
            transition: all 0.3s;
          }
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(139, 92, 246, 0.4);
          }
          .token-display {
            background: white;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            word-break: break-all;
            color: #8b5cf6;
            border: 2px dashed #e2e8f0;
          }
          .expiry-notice {
            background: #fff5f5;
            border-left: 4px solid #f56565;
            padding: 15px;
            margin: 25px 0;
            border-radius: 4px;
          }
          .expiry-notice p {
            margin: 0;
            color: #c53030;
            font-weight: 600;
          }
          .info-box {
            background: #ebf8ff;
            border-left: 4px solid #3182ce;
            padding: 15px;
            margin: 25px 0;
            border-radius: 4px;
          }
          .info-box p {
            margin: 5px 0;
            color: #2c5282;
          }
          .footer {
            text-align: center;
            padding: 30px 20px;
            background: #f7fafc;
            color: #718096;
            font-size: 13px;
            border-top: 1px solid #e2e8f0;
          }
          .footer p {
            margin: 8px 0;
          }
          .footer a {
            color: #8b5cf6;
            text-decoration: none;
          }
          .security-notice {
            background: #fffaf0;
            border-left: 4px solid #ed8936;
            padding: 15px;
            margin: 25px 0;
            border-radius: 4px;
          }
          .security-notice p {
            margin: 5px 0;
            color: #7c2d12;
            font-size: 14px;
          }
          .icon {
            font-size: 48px;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">✉️</div>
            <h1>HALCYON REST</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Premium Villa Management</p>
          </div>

          <div class="content">
            <h2>Welcome, ${userName}!</h2>

            <p>Thank you for registering with Halcyon Rest Villa Management System. We're excited to have you on board!</p>

            <p>To complete your registration and activate your account, please verify your email address by clicking the button below:</p>

            <div class="button-container">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>

            <div class="verification-box">
              <p style="margin: 0 0 10px 0; font-weight: 600; color: #2d3748;">Alternative Verification Method:</p>
              <p style="margin: 0 0 10px 0; font-size: 14px;">If the button above doesn't work, copy and paste this link into your browser:</p>
              <div class="token-display">${verificationUrl}</div>
            </div>

            <div class="expiry-notice">
              <p>⏰ This verification link will expire in 24 hours.</p>
            </div>

            <div class="info-box">
              <p style="margin: 0 0 8px 0; font-weight: 600;">What happens after verification?</p>
              <p style="margin: 5px 0;">✓ Full access to your account</p>
              <p style="margin: 5px 0;">✓ Ability to manage properties and reservations</p>
              <p style="margin: 5px 0;">✓ Access to all system features</p>
            </div>

            <div class="security-notice">
              <p style="margin: 0 0 8px 0; font-weight: 600;">🔒 Security Notice:</p>
              <p style="margin: 5px 0;">If you didn't create an account with Halcyon Rest, please ignore this email. Your email address will not be used without verification.</p>
            </div>

            <p style="margin-top: 30px;">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>

            <p style="margin-top: 25px; color: #2d3748;">Best regards,<br><strong>The Halcyon Rest Team</strong></p>
          </div>

          <div class="footer">
            <p><strong>Halcyon Rest Villa Management</strong></p>
            <p>Email: <a href="mailto:info@halcyonrest.com">info@halcyonrest.com</a> | Phone: +94 77 123 4567</p>
            <p style="margin-top: 15px; font-size: 11px; color: #a0aec0;">
              © ${new Date().getFullYear()} Halcyon Rest. All rights reserved.
            </p>
            <p style="font-size: 11px; color: #a0aec0;">
              This is an automated message, please do not reply directly to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to Halcyon Rest, ${userName}!

      Thank you for registering with Halcyon Rest Villa Management System.

      To complete your registration and activate your account, please verify your email address by visiting this link:

      ${verificationUrl}

      This verification link will expire in 24 hours.

      If you didn't create an account with Halcyon Rest, please ignore this email.

      Best regards,
      The Halcyon Rest Team

      ---
      Email: info@halcyonrest.com
      Phone: +94 77 123 4567
    `;

    try {
      const result = await this.sendEmail(
        email,
        'Verify Your Email - Halcyon Rest',
        html,
        text
      );

      logger.info('Email verification sent successfully', {
        email,
        verificationToken: verificationToken.substring(0, 10) + '...',
        messageId: result.messageId
      });

      return result;
    } catch (error) {
      logger.logError(error);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }
}

module.exports = new EmailService();
