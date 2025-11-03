import React, { useEffect, useState, useRef } from 'react';
import { invoiceAPI } from '../services/api';
import './Invoice.css';

/**
 * Print-friendly Invoice Component
 * Displays invoice with professional styling and print support
 */
const Invoice = ({ invoiceId, onClose }) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const componentRef = useRef();

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const response = await invoiceAPI.getById(invoiceId);
      setInvoice(response.data.data.invoice);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invoice');
      console.error('Error loading invoice:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      const response = await invoiceAPI.download(invoiceId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading invoice:', err);
      alert('Failed to download invoice');
    }
  };

  const handleEmailInvoice = async () => {
    try {
      await invoiceAPI.sendEmail(invoiceId);
      alert('Invoice sent successfully!');
    } catch (err) {
      console.error('Error sending invoice:', err);
      alert('Failed to send invoice');
    }
  };

  const formatCurrency = (amount, currency = 'LKR') => {
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { label: 'Paid', class: 'status-paid' },
      partially_paid: { label: 'Partially Paid', class: 'status-partial' },
      unpaid: { label: 'Unpaid', class: 'status-unpaid' },
      overdue: { label: 'Overdue', class: 'status-overdue' },
      cancelled: { label: 'Cancelled', class: 'status-cancelled' }
    };

    const config = statusConfig[status] || { label: status, class: 'status-default' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  if (loading) {
    return (
      <div className="invoice-loading">
        <div className="spinner"></div>
        <p>Loading invoice...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invoice-error">
        <p>{error}</p>
        <button onClick={onClose} className="btn-secondary">Close</button>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  const balance = parseFloat(invoice.total) - parseFloat(invoice.paidAmount);

  return (
    <div className="invoice-container">
      {/* Action Buttons - Hidden in print */}
      <div className="invoice-actions no-print">
        <button onClick={handlePrint} className="btn-primary">
          <i className="icon-print"></i> Print Invoice
        </button>
        <button onClick={handleDownload} className="btn-secondary">
          <i className="icon-download"></i> Download PDF
        </button>
        <button onClick={handleEmailInvoice} className="btn-secondary">
          <i className="icon-email"></i> Email Invoice
        </button>
        {onClose && (
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        )}
      </div>

      {/* Invoice Document */}
      <div className="invoice-document" ref={componentRef}>
        {/* Header */}
        <div className="invoice-header">
          <div className="company-info">
            <h1 className="company-name">HALCYON REST</h1>
            <p className="company-tagline">Premium Villa Management</p>
            {invoice.issuedFromAddress && (
              <p className="company-address">{invoice.issuedFromAddress}</p>
            )}
          </div>
          <div className="invoice-title">
            <h2>INVOICE</h2>
            {invoice.isVoided && (
              <div className="voided-stamp">VOIDED</div>
            )}
          </div>
        </div>

        <div className="invoice-divider"></div>

        {/* Invoice Details */}
        <div className="invoice-meta">
          <div className="bill-to">
            <h3>BILL TO:</h3>
            <p className="client-name">{invoice.issuedTo}</p>
            {invoice.issuedToEmail && (
              <p className="client-email">{invoice.issuedToEmail}</p>
            )}
            {invoice.issuedToAddress && (
              <p className="client-address">{invoice.issuedToAddress}</p>
            )}
          </div>
          <div className="invoice-details">
            <div className="detail-row">
              <span className="detail-label">Invoice Number:</span>
              <span className="detail-value">{invoice.invoiceNumber}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Issue Date:</span>
              <span className="detail-value">{formatDate(invoice.issueDate)}</span>
            </div>
            {invoice.dueDate && (
              <div className="detail-row">
                <span className="detail-label">Due Date:</span>
                <span className="detail-value">{formatDate(invoice.dueDate)}</span>
              </div>
            )}
            {invoice.reservation && (
              <div className="detail-row">
                <span className="detail-label">Booking Ref:</span>
                <span className="detail-value">{invoice.reservation.confirmationNumber}</span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <span className="detail-value">{getStatusBadge(invoice.paymentStatus)}</span>
            </div>
          </div>
        </div>

        {/* Reservation Details (if applicable) */}
        {invoice.reservation && (
          <div className="reservation-details">
            <h3>RESERVATION DETAILS</h3>
            <div className="reservation-grid">
              <div>
                <span className="label">Check-in:</span>
                <span className="value">{formatDate(invoice.reservation.checkInDate)}</span>
              </div>
              <div>
                <span className="label">Check-out:</span>
                <span className="value">{formatDate(invoice.reservation.checkOutDate)}</span>
              </div>
              <div>
                <span className="label">Nights:</span>
                <span className="value">{invoice.reservation.nights}</span>
              </div>
              <div>
                <span className="label">Guests:</span>
                <span className="value">
                  {invoice.reservation.adults} Adults, {invoice.reservation.children} Children
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Line Items Table */}
        <div className="invoice-table">
          <table>
            <thead>
              <tr>
                <th className="col-description">Description</th>
                <th className="col-quantity">Quantity</th>
                <th className="col-rate">Rate</th>
                <th className="col-amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems && invoice.lineItems.map((item, index) => (
                <tr key={index}>
                  <td>{item.description}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">{formatCurrency(item.rate, invoice.currency)}</td>
                  <td className="text-right">{formatCurrency(item.amount, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="invoice-totals">
          <div className="totals-section">
            <div className="total-row">
              <span className="total-label">Subtotal:</span>
              <span className="total-value">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>

            {parseFloat(invoice.discountAmount) > 0 && (
              <div className="total-row discount">
                <span className="total-label">Discount:</span>
                <span className="total-value">-{formatCurrency(invoice.discountAmount, invoice.currency)}</span>
              </div>
            )}

            {parseFloat(invoice.taxAmount) > 0 && (
              <div className="total-row">
                <span className="total-label">Tax ({invoice.taxRate}%):</span>
                <span className="total-value">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
              </div>
            )}

            <div className="total-divider"></div>

            <div className="total-row grand-total">
              <span className="total-label">TOTAL:</span>
              <span className="total-value">{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>

            {parseFloat(invoice.paidAmount) > 0 && (
              <>
                <div className="total-row paid-amount">
                  <span className="total-label">Amount Paid:</span>
                  <span className="total-value">{formatCurrency(invoice.paidAmount, invoice.currency)}</span>
                </div>

                <div className={`total-row balance-due ${balance > 0 ? 'outstanding' : 'fully-paid'}`}>
                  <span className="total-label">Balance Due:</span>
                  <span className="total-value">{formatCurrency(balance, invoice.currency)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payment Information */}
        {invoice.paymentStatus === 'paid' && invoice.paymentDate && (
          <div className="payment-info">
            <div className="paid-stamp">PAID</div>
            <p className="payment-date">
              Paid on {formatDate(invoice.paymentDate)}
              {invoice.paymentMethod && ` via ${invoice.paymentMethod}`}
            </p>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="invoice-notes">
            <h4>Notes:</h4>
            <p>{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="invoice-footer">
          <p className="thank-you">Thank you for your business!</p>
          <p className="footer-note">
            This is a computer-generated invoice. No signature required.
          </p>
          {invoice.issuedToEmail && (
            <p className="contact-info">
              For any queries, please contact us at info@halcyonrest.com | +94 77 123 4567
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Invoice;
