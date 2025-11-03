import React, { useState, useEffect } from 'react';
import { useInvoices } from '../../hooks/useInvoices';
import './InvoiceManagement.css';

const InvoiceManagement = () => {
  const {
    invoices,
    selectedInvoice,
    loading,
    error,
    filters,
    pagination,
    loadInvoices,
    loadInvoiceById,
    generateForReservation,
    createManual,
    recordPayment,
    voidInvoice,
    deleteInvoice,
    downloadInvoice,
    sendInvoice,
    updateFilters,
    clearFilters,
    calculateStatistics,
    setSelectedInvoice
  } = useInvoices();

  // UI State
  const [activeSection, setActiveSection] = useState('list'); // list, create, view
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // payment, void, send
  const [notification, setNotification] = useState(null);

  // Form states
  const [manualInvoiceForm, setManualInvoiceForm] = useState({
    type: 'other',
    issuedTo: '',
    issuedToEmail: '',
    issuedToAddress: '',
    currency: 'LKR',
    dueDate: '',
    notes: '',
    category: '',
    lineItems: [{ description: '', quantity: 1, rate: 0 }],
    taxRate: 0,
    discountAmount: 0
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0]
  });

  const [voidForm, setVoidForm] = useState({
    reason: ''
  });

  // Statistics
  const statistics = calculateStatistics();

  // Show notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    updateFilters({ [key]: value, page: 1 });
  };

  // Handle clear filters
  const handleClearFilters = () => {
    clearFilters();
    loadInvoices();
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    updateFilters({ page: newPage });
    loadInvoices({ page: newPage });
  };

  // Handle view invoice
  const handleViewInvoice = async (invoice) => {
    await loadInvoiceById(invoice.id);
    setActiveSection('view');
  };

  // Handle add line item
  const handleAddLineItem = () => {
    setManualInvoiceForm(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, { description: '', quantity: 1, rate: 0 }]
    }));
  };

  // Handle remove line item
  const handleRemoveLineItem = (index) => {
    setManualInvoiceForm(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index)
    }));
  };

  // Handle line item change
  const handleLineItemChange = (index, field, value) => {
    setManualInvoiceForm(prev => {
      const newLineItems = [...prev.lineItems];
      newLineItems[index] = { ...newLineItems[index], [field]: value };
      return { ...prev, lineItems: newLineItems };
    });
  };

  // Calculate manual invoice totals
  const calculateManualInvoiceTotals = () => {
    const subtotal = manualInvoiceForm.lineItems.reduce((sum, item) => {
      return sum + (parseFloat(item.rate) || 0) * (parseInt(item.quantity) || 0);
    }, 0);

    const taxAmount = subtotal * (parseFloat(manualInvoiceForm.taxRate) || 0) / 100;
    const discountAmount = parseFloat(manualInvoiceForm.discountAmount) || 0;
    const total = subtotal + taxAmount - discountAmount;

    return { subtotal, taxAmount, discountAmount, total };
  };

  // Handle create manual invoice
  const handleCreateManualInvoice = async (e) => {
    e.preventDefault();

    const totals = calculateManualInvoiceTotals();
    const result = await createManual({
      ...manualInvoiceForm,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      total: totals.total
    });

    if (result.success) {
      showNotification('Invoice created successfully!');
      setActiveSection('list');
      // Reset form
      setManualInvoiceForm({
        type: 'other',
        issuedTo: '',
        issuedToEmail: '',
        issuedToAddress: '',
        currency: 'LKR',
        dueDate: '',
        notes: '',
        category: '',
        lineItems: [{ description: '', quantity: 1, rate: 0 }],
        taxRate: 0,
        discountAmount: 0
      });
    } else {
      showNotification(result.error || 'Failed to create invoice', 'error');
    }
  };

  // Handle record payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();

    const result = await recordPayment(selectedInvoice.id, paymentForm);

    if (result.success) {
      showNotification('Payment recorded successfully!');
      setShowModal(false);
      setPaymentForm({
        amount: '',
        paymentMethod: 'cash',
        paymentDate: new Date().toISOString().split('T')[0]
      });
      await loadInvoiceById(selectedInvoice.id);
    } else {
      showNotification(result.error || 'Failed to record payment', 'error');
    }
  };

  // Handle void invoice
  const handleVoidInvoice = async (e) => {
    e.preventDefault();

    const result = await voidInvoice(selectedInvoice.id, voidForm.reason);

    if (result.success) {
      showNotification('Invoice voided successfully!');
      setShowModal(false);
      setVoidForm({ reason: '' });
      await loadInvoiceById(selectedInvoice.id);
    } else {
      showNotification(result.error || 'Failed to void invoice', 'error');
    }
  };

  // Handle download invoice
  const handleDownloadInvoice = async (invoice) => {
    const result = await downloadInvoice(invoice.id, invoice.invoiceNumber);
    if (!result.success) {
      showNotification(result.error || 'Failed to download invoice', 'error');
    }
  };

  // Handle send invoice
  const handleSendInvoice = async () => {
    const result = await sendInvoice(selectedInvoice.id);

    if (result.success) {
      showNotification(`Invoice sent successfully to ${result.sentTo}!`);
      setShowModal(false);
      await loadInvoiceById(selectedInvoice.id);
    } else {
      showNotification(result.error || 'Failed to send invoice', 'error');
    }
  };

  // Handle delete invoice
  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;

    const result = await deleteInvoice(invoiceId);

    if (result.success) {
      showNotification('Invoice deleted successfully!');
      if (activeSection === 'view') {
        setActiveSection('list');
      }
    } else {
      showNotification(result.error || 'Failed to delete invoice', 'error');
    }
  };

  // Format currency
  const formatCurrency = (amount, currency = 'LKR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get payment status badge class
  const getPaymentStatusClass = (status) => {
    switch (status) {
      case 'paid': return 'status-badge status-paid';
      case 'unpaid': return 'status-badge status-unpaid';
      case 'partially_paid': return 'status-badge status-partial';
      case 'cancelled': return 'status-badge status-cancelled';
      default: return 'status-badge';
    }
  };

  // Apply filters when they change
  useEffect(() => {
    loadInvoices(filters);
  }, [filters.type, filters.paymentStatus, filters.search, filters.startDate, filters.endDate]);

  return (
    <div className="invoice-management-container">
      {/* Notification */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="invoice-header">
        <h1>Invoice Management</h1>
        <div className="header-actions">
          <button
            className={`tab-button ${activeSection === 'list' ? 'active' : ''}`}
            onClick={() => setActiveSection('list')}
          >
            Invoice List
          </button>
          <button
            className={`tab-button ${activeSection === 'create' ? 'active' : ''}`}
            onClick={() => setActiveSection('create')}
          >
            Create Invoice
          </button>
        </div>
      </div>

      {/* Statistics Section */}
      {activeSection === 'list' && (
        <div className="invoice-statistics">
          <div className="stat-card">
            <div className="stat-icon">📄</div>
            <div className="stat-content">
              <div className="stat-value">{statistics.total}</div>
              <div className="stat-label">Total Invoices</div>
            </div>
          </div>
          <div className="stat-card stat-success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{statistics.paid}</div>
              <div className="stat-label">Paid</div>
            </div>
          </div>
          <div className="stat-card stat-warning">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <div className="stat-value">{statistics.partiallyPaid}</div>
              <div className="stat-label">Partially Paid</div>
            </div>
          </div>
          <div className="stat-card stat-danger">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <div className="stat-value">{statistics.unpaid}</div>
              <div className="stat-label">Unpaid</div>
            </div>
          </div>
          <div className="stat-card stat-info">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-value">{formatCurrency(statistics.totalAmount)}</div>
              <div className="stat-label">Total Amount</div>
            </div>
          </div>
          <div className="stat-card stat-info">
            <div className="stat-icon">💵</div>
            <div className="stat-content">
              <div className="stat-value">{formatCurrency(statistics.unpaidAmount)}</div>
              <div className="stat-label">Unpaid Amount</div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice List Section */}
      {activeSection === 'list' && (
        <>
          {/* Filters */}
          <div className="invoice-filters">
            <input
              type="text"
              placeholder="Search by invoice number or customer..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="search-input"
            />
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="filter-select"
            >
              <option value="">All Types</option>
              <option value="guest_invoice">Guest Invoice</option>
              <option value="vendor_invoice">Vendor Invoice</option>
              <option value="other">Other</option>
            </select>
            <select
              value={filters.paymentStatus}
              onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input
              type="date"
              placeholder="Start Date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="date-input"
            />
            <input
              type="date"
              placeholder="End Date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="date-input"
            />
            <button onClick={handleClearFilters} className="clear-filters-btn">
              Clear Filters
            </button>
          </div>

          {/* Invoice Table */}
          {loading ? (
            <div className="loading">Loading invoices...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : invoices.length === 0 ? (
            <div className="empty-state">
              <p>No invoices found. Create your first invoice!</p>
            </div>
          ) : (
            <>
              <div className="invoice-table-container">
                <table className="invoice-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Type</th>
                      <th>Customer</th>
                      <th>Issue Date</th>
                      <th>Due Date</th>
                      <th>Amount</th>
                      <th>Paid</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(invoice => (
                      <tr key={invoice.id} className={invoice.isVoided ? 'voided-row' : ''}>
                        <td className="invoice-number">{invoice.invoiceNumber}</td>
                        <td>
                          <span className="type-badge">{invoice.type.replace('_', ' ')}</span>
                        </td>
                        <td>{invoice.issuedTo}</td>
                        <td>{formatDate(invoice.issueDate)}</td>
                        <td>{formatDate(invoice.dueDate)}</td>
                        <td className="amount-cell">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </td>
                        <td className="amount-cell">
                          {formatCurrency(invoice.paidAmount, invoice.currency)}
                        </td>
                        <td>
                          <span className={getPaymentStatusClass(invoice.paymentStatus)}>
                            {invoice.paymentStatus.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <button
                            className="action-btn view-btn"
                            onClick={() => handleViewInvoice(invoice)}
                            title="View Details"
                          >
                            👁️
                          </button>
                          {invoice.filePath && (
                            <button
                              className="action-btn download-btn"
                              onClick={() => handleDownloadInvoice(invoice)}
                              title="Download PDF"
                            >
                              ⬇️
                            </button>
                          )}
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteInvoice(invoice.id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="pagination">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className="pagination-btn"
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                  </span>
                  <button
                    disabled={pagination.page === pagination.pages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Create Manual Invoice Section */}
      {activeSection === 'create' && (
        <div className="invoice-form-section">
          <h2>Create Manual Invoice</h2>
          <form onSubmit={handleCreateManualInvoice} className="invoice-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Invoice Type *</label>
                <select
                  value={manualInvoiceForm.type}
                  onChange={(e) => setManualInvoiceForm({ ...manualInvoiceForm, type: e.target.value })}
                  required
                >
                  <option value="guest_invoice">Guest Invoice</option>
                  <option value="vendor_invoice">Vendor Invoice</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Currency *</label>
                <select
                  value={manualInvoiceForm.currency}
                  onChange={(e) => setManualInvoiceForm({ ...manualInvoiceForm, currency: e.target.value })}
                  required
                >
                  <option value="LKR">LKR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>

              <div className="form-group">
                <label>Customer Name *</label>
                <input
                  type="text"
                  value={manualInvoiceForm.issuedTo}
                  onChange={(e) => setManualInvoiceForm({ ...manualInvoiceForm, issuedTo: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Customer Email</label>
                <input
                  type="email"
                  value={manualInvoiceForm.issuedToEmail}
                  onChange={(e) => setManualInvoiceForm({ ...manualInvoiceForm, issuedToEmail: e.target.value })}
                />
              </div>

              <div className="form-group full-width">
                <label>Customer Address</label>
                <textarea
                  value={manualInvoiceForm.issuedToAddress}
                  onChange={(e) => setManualInvoiceForm({ ...manualInvoiceForm, issuedToAddress: e.target.value })}
                  rows="2"
                />
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={manualInvoiceForm.dueDate}
                  onChange={(e) => setManualInvoiceForm({ ...manualInvoiceForm, dueDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={manualInvoiceForm.category}
                  onChange={(e) => setManualInvoiceForm({ ...manualInvoiceForm, category: e.target.value })}
                  placeholder="e.g., Accommodation, Services"
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="line-items-section">
              <div className="section-header">
                <h3>Line Items</h3>
                <button type="button" onClick={handleAddLineItem} className="add-item-btn">
                  + Add Item
                </button>
              </div>

              {manualInvoiceForm.lineItems.map((item, index) => (
                <div key={index} className="line-item-row">
                  <div className="form-group flex-2">
                    <label>Description *</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label>Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label>Rate *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => handleLineItemChange(index, 'rate', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label>Amount</label>
                    <input
                      type="text"
                      value={formatCurrency((item.quantity || 0) * (item.rate || 0), manualInvoiceForm.currency)}
                      disabled
                      className="disabled-input"
                    />
                  </div>
                  {manualInvoiceForm.lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(index)}
                      className="remove-item-btn"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Totals Section */}
            <div className="invoice-totals-section">
              <div className="form-grid">
                <div className="form-group">
                  <label>Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={manualInvoiceForm.taxRate}
                    onChange={(e) => setManualInvoiceForm({ ...manualInvoiceForm, taxRate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Discount Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={manualInvoiceForm.discountAmount}
                    onChange={(e) => setManualInvoiceForm({ ...manualInvoiceForm, discountAmount: e.target.value })}
                  />
                </div>
              </div>

              <div className="totals-display">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(calculateManualInvoiceTotals().subtotal, manualInvoiceForm.currency)}</span>
                </div>
                <div className="total-row">
                  <span>Tax ({manualInvoiceForm.taxRate}%):</span>
                  <span>{formatCurrency(calculateManualInvoiceTotals().taxAmount, manualInvoiceForm.currency)}</span>
                </div>
                <div className="total-row">
                  <span>Discount:</span>
                  <span>-{formatCurrency(calculateManualInvoiceTotals().discountAmount, manualInvoiceForm.currency)}</span>
                </div>
                <div className="total-row total-amount">
                  <span>Total:</span>
                  <span>{formatCurrency(calculateManualInvoiceTotals().total, manualInvoiceForm.currency)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="form-group full-width">
              <label>Notes</label>
              <textarea
                value={manualInvoiceForm.notes}
                onChange={(e) => setManualInvoiceForm({ ...manualInvoiceForm, notes: e.target.value })}
                rows="3"
                placeholder="Additional notes or payment instructions..."
              />
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button type="button" onClick={() => setActiveSection('list')} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Invoice'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Invoice Section */}
      {activeSection === 'view' && selectedInvoice && (
        <div className="invoice-view-section">
          <div className="view-header">
            <button onClick={() => setActiveSection('list')} className="back-btn">
              ← Back to List
            </button>
            <h2>Invoice Details</h2>
            <div className="view-actions">
              {selectedInvoice.filePath && (
                <button
                  onClick={() => handleDownloadInvoice(selectedInvoice)}
                  className="btn-action"
                >
                  Download PDF
                </button>
              )}
              {selectedInvoice.issuedToEmail && !selectedInvoice.isVoided && (
                <button
                  onClick={() => {
                    setModalType('send');
                    setShowModal(true);
                  }}
                  className="btn-action"
                >
                  Send via Email
                </button>
              )}
              {selectedInvoice.paymentStatus !== 'paid' && !selectedInvoice.isVoided && (
                <button
                  onClick={() => {
                    setModalType('payment');
                    setShowModal(true);
                    setPaymentForm({
                      amount: (parseFloat(selectedInvoice.total) - parseFloat(selectedInvoice.paidAmount)).toFixed(2),
                      paymentMethod: 'cash',
                      paymentDate: new Date().toISOString().split('T')[0]
                    });
                  }}
                  className="btn-primary"
                >
                  Record Payment
                </button>
              )}
              {!selectedInvoice.isVoided && (
                <button
                  onClick={() => {
                    setModalType('void');
                    setShowModal(true);
                  }}
                  className="btn-danger"
                >
                  Void Invoice
                </button>
              )}
            </div>
          </div>

          <div className="invoice-detail-card">
            {/* Invoice Header */}
            <div className="invoice-detail-header">
              <div>
                <h1 className="invoice-detail-number">{selectedInvoice.invoiceNumber}</h1>
                <span className={getPaymentStatusClass(selectedInvoice.paymentStatus)}>
                  {selectedInvoice.paymentStatus.replace('_', ' ')}
                </span>
                {selectedInvoice.isVoided && (
                  <span className="status-badge status-voided">VOIDED</span>
                )}
              </div>
              <div className="invoice-detail-dates">
                <div><strong>Issue Date:</strong> {formatDate(selectedInvoice.issueDate)}</div>
                <div><strong>Due Date:</strong> {formatDate(selectedInvoice.dueDate)}</div>
                {selectedInvoice.sentAt && (
                  <div><strong>Sent At:</strong> {formatDate(selectedInvoice.sentAt)}</div>
                )}
              </div>
            </div>

            {/* Billing Information */}
            <div className="invoice-billing-info">
              <div>
                <h3>From:</h3>
                <p><strong>{selectedInvoice.issuedFrom}</strong></p>
                <p>{selectedInvoice.issuedFromAddress}</p>
              </div>
              <div>
                <h3>To:</h3>
                <p><strong>{selectedInvoice.issuedTo}</strong></p>
                {selectedInvoice.issuedToEmail && <p>{selectedInvoice.issuedToEmail}</p>}
                {selectedInvoice.issuedToAddress && (
                  <p style={{ whiteSpace: 'pre-line' }}>{selectedInvoice.issuedToAddress}</p>
                )}
              </div>
            </div>

            {/* Line Items */}
            {selectedInvoice.lineItems && selectedInvoice.lineItems.length > 0 && (
              <div className="invoice-line-items">
                <h3>Items:</h3>
                <table className="line-items-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Quantity</th>
                      <th>Rate</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.lineItems.map((item, index) => (
                      <tr key={index}>
                        <td>{item.description}</td>
                        <td>{item.quantity || 1}</td>
                        <td>{formatCurrency(item.rate, selectedInvoice.currency)}</td>
                        <td className="text-right">
                          {formatCurrency(item.amount, selectedInvoice.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals */}
            <div className="invoice-totals">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}</span>
              </div>
              {parseFloat(selectedInvoice.taxAmount) > 0 && (
                <div className="total-row">
                  <span>Tax ({selectedInvoice.taxRate}%):</span>
                  <span>{formatCurrency(selectedInvoice.taxAmount, selectedInvoice.currency)}</span>
                </div>
              )}
              {parseFloat(selectedInvoice.discountAmount) > 0 && (
                <div className="total-row">
                  <span>Discount:</span>
                  <span>-{formatCurrency(selectedInvoice.discountAmount, selectedInvoice.currency)}</span>
                </div>
              )}
              <div className="total-row total-amount">
                <span>Total:</span>
                <span>{formatCurrency(selectedInvoice.total, selectedInvoice.currency)}</span>
              </div>
              <div className="total-row payment-info">
                <span>Paid:</span>
                <span className="paid-amount">
                  {formatCurrency(selectedInvoice.paidAmount, selectedInvoice.currency)}
                </span>
              </div>
              <div className="total-row balance-due">
                <span>Balance Due:</span>
                <span>
                  {formatCurrency(
                    parseFloat(selectedInvoice.total) - parseFloat(selectedInvoice.paidAmount),
                    selectedInvoice.currency
                  )}
                </span>
              </div>
            </div>

            {/* Payment Information */}
            {selectedInvoice.paymentMethod && (
              <div className="payment-details">
                <h3>Payment Information:</h3>
                <p><strong>Method:</strong> {selectedInvoice.paymentMethod}</p>
                {selectedInvoice.paymentDate && (
                  <p><strong>Date:</strong> {formatDate(selectedInvoice.paymentDate)}</p>
                )}
              </div>
            )}

            {/* Notes */}
            {selectedInvoice.notes && (
              <div className="invoice-notes">
                <h3>Notes:</h3>
                <p>{selectedInvoice.notes}</p>
              </div>
            )}

            {/* Void Information */}
            {selectedInvoice.isVoided && (
              <div className="void-info">
                <h3>Void Information:</h3>
                <p><strong>Voided At:</strong> {formatDate(selectedInvoice.voidedAt)}</p>
                {selectedInvoice.voidReason && (
                  <p><strong>Reason:</strong> {selectedInvoice.voidReason}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {modalType === 'payment' && (
              <>
                <h2>Record Payment</h2>
                <form onSubmit={handleRecordPayment}>
                  <div className="form-group">
                    <label>Amount *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Payment Method *</label>
                    <select
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                      required
                    >
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="check">Check</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Payment Date *</label>
                    <input
                      type="date"
                      value={paymentForm.paymentDate}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={loading}>
                      {loading ? 'Recording...' : 'Record Payment'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {modalType === 'void' && (
              <>
                <h2>Void Invoice</h2>
                <form onSubmit={handleVoidInvoice}>
                  <div className="form-group">
                    <label>Reason for Voiding *</label>
                    <textarea
                      value={voidForm.reason}
                      onChange={(e) => setVoidForm({ reason: e.target.value })}
                      required
                      rows="4"
                      placeholder="Enter reason for voiding this invoice..."
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn-danger" disabled={loading}>
                      {loading ? 'Voiding...' : 'Void Invoice'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {modalType === 'send' && (
              <>
                <h2>Send Invoice via Email</h2>
                <p>Send invoice {selectedInvoice.invoiceNumber} to {selectedInvoice.issuedToEmail}?</p>
                <div className="modal-actions">
                  <button onClick={() => setShowModal(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button onClick={handleSendInvoice} className="btn-primary" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Email'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManagement;
