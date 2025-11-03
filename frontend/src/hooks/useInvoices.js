import { useState, useCallback, useEffect } from 'react';
import { invoiceAPI } from '../services/api';

/**
 * Custom hook for Invoice Management
 * Handles invoice data, generation, and operations
 */
export const useInvoices = () => {
  // State management
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    paymentStatus: '',
    search: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 50
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    pages: 0
  });

  /**
   * Load all invoices with filters
   */
  const loadInvoices = useCallback(async (customFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const appliedFilters = { ...filters, ...customFilters };
      const response = await invoiceAPI.getAll(appliedFilters);

      if (response.data.success) {
        setInvoices(response.data.data.invoices);
        setPagination(response.data.data.pagination);
      } else {
        setError(response.data.message || 'Failed to load invoices');
      }
    } catch (err) {
      console.error('Error loading invoices:', err);
      setError(err.response?.data?.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Load single invoice by ID
   */
  const loadInvoiceById = useCallback(async (invoiceId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await invoiceAPI.getById(invoiceId);

      if (response.data.success) {
        setSelectedInvoice(response.data.data.invoice);
        return response.data.data.invoice;
      } else {
        setError(response.data.message || 'Failed to load invoice');
        return null;
      }
    } catch (err) {
      console.error('Error loading invoice:', err);
      setError(err.response?.data?.message || 'Failed to load invoice');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Generate invoice for a reservation
   */
  const generateForReservation = useCallback(async (reservationId, invoiceData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await invoiceAPI.generateForReservation(reservationId, invoiceData);

      if (response.data.success) {
        await loadInvoices();
        return {
          success: true,
          invoice: response.data.data.invoice,
          downloadUrl: response.data.data.downloadUrl
        };
      } else {
        setError(response.data.message || 'Failed to generate invoice');
        return { success: false, error: response.data.message };
      }
    } catch (err) {
      console.error('Error generating invoice:', err);
      const errorMsg = err.response?.data?.message || 'Failed to generate invoice';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [loadInvoices]);

  /**
   * Create manual invoice
   */
  const createManual = useCallback(async (invoiceData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await invoiceAPI.createManual(invoiceData);

      if (response.data.success) {
        await loadInvoices();
        return { success: true, invoice: response.data.data.invoice };
      } else {
        setError(response.data.message || 'Failed to create invoice');
        return { success: false, error: response.data.message };
      }
    } catch (err) {
      console.error('Error creating manual invoice:', err);
      const errorMsg = err.response?.data?.message || 'Failed to create invoice';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [loadInvoices]);

  /**
   * Upload invoice file
   */
  const uploadInvoice = useCallback(async (formData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await invoiceAPI.upload(formData);

      if (response.data.success) {
        await loadInvoices();
        return { success: true, invoice: response.data.data.invoice };
      } else {
        setError(response.data.message || 'Failed to upload invoice');
        return { success: false, error: response.data.message };
      }
    } catch (err) {
      console.error('Error uploading invoice:', err);
      const errorMsg = err.response?.data?.message || 'Failed to upload invoice';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [loadInvoices]);

  /**
   * Record payment for invoice
   */
  const recordPayment = useCallback(async (invoiceId, paymentData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await invoiceAPI.recordPayment(invoiceId, paymentData);

      if (response.data.success) {
        await loadInvoices();
        if (selectedInvoice?.id === invoiceId) {
          setSelectedInvoice(response.data.data.invoice);
        }
        return { success: true, invoice: response.data.data.invoice };
      } else {
        setError(response.data.message || 'Failed to record payment');
        return { success: false, error: response.data.message };
      }
    } catch (err) {
      console.error('Error recording payment:', err);
      const errorMsg = err.response?.data?.message || 'Failed to record payment';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [loadInvoices, selectedInvoice]);

  /**
   * Void invoice
   */
  const voidInvoice = useCallback(async (invoiceId, reason) => {
    setLoading(true);
    setError(null);

    try {
      const response = await invoiceAPI.void(invoiceId, reason);

      if (response.data.success) {
        await loadInvoices();
        if (selectedInvoice?.id === invoiceId) {
          setSelectedInvoice(response.data.data.invoice);
        }
        return { success: true };
      } else {
        setError(response.data.message || 'Failed to void invoice');
        return { success: false, error: response.data.message };
      }
    } catch (err) {
      console.error('Error voiding invoice:', err);
      const errorMsg = err.response?.data?.message || 'Failed to void invoice';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [loadInvoices, selectedInvoice]);

  /**
   * Delete invoice
   */
  const deleteInvoice = useCallback(async (invoiceId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await invoiceAPI.delete(invoiceId);

      if (response.data.success) {
        await loadInvoices();
        if (selectedInvoice?.id === invoiceId) {
          setSelectedInvoice(null);
        }
        return { success: true };
      } else {
        setError(response.data.message || 'Failed to delete invoice');
        return { success: false, error: response.data.message };
      }
    } catch (err) {
      console.error('Error deleting invoice:', err);
      const errorMsg = err.response?.data?.message || 'Failed to delete invoice';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [loadInvoices, selectedInvoice]);

  /**
   * Download invoice PDF
   */
  const downloadInvoice = useCallback(async (invoiceId, invoiceNumber) => {
    setLoading(true);
    setError(null);

    try {
      const response = await invoiceAPI.download(invoiceId);

      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoiceNumber || 'invoice'}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (err) {
      console.error('Error downloading invoice:', err);
      const errorMsg = err.response?.data?.message || 'Failed to download invoice';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Send invoice via email
   */
  const sendInvoice = useCallback(async (invoiceId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await invoiceAPI.send(invoiceId);

      if (response.data.success) {
        // Update local state to reflect sent status
        await loadInvoices();
        return {
          success: true,
          sentTo: response.data.data.sentTo,
          sentAt: response.data.data.sentAt
        };
      } else {
        setError(response.data.message || 'Failed to send invoice');
        return { success: false, error: response.data.message };
      }
    } catch (err) {
      console.error('Error sending invoice:', err);
      const errorMsg = err.response?.data?.message || 'Failed to send invoice';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [loadInvoices]);

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Clear filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      type: '',
      paymentStatus: '',
      search: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 50
    });
  }, []);

  /**
   * Calculate invoice statistics
   */
  const calculateStatistics = useCallback(() => {
    if (!invoices.length) {
      return {
        total: 0,
        paid: 0,
        unpaid: 0,
        partiallyPaid: 0,
        overdue: 0,
        totalAmount: 0,
        paidAmount: 0,
        unpaidAmount: 0
      };
    }

    const now = new Date();
    const stats = {
      total: invoices.length,
      paid: 0,
      unpaid: 0,
      partiallyPaid: 0,
      overdue: 0,
      totalAmount: 0,
      paidAmount: 0,
      unpaidAmount: 0
    };

    invoices.forEach(invoice => {
      const total = parseFloat(invoice.total) || 0;
      const paid = parseFloat(invoice.paidAmount) || 0;
      const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;

      stats.totalAmount += total;
      stats.paidAmount += paid;
      stats.unpaidAmount += (total - paid);

      if (invoice.paymentStatus === 'paid') {
        stats.paid++;
      } else if (invoice.paymentStatus === 'unpaid') {
        stats.unpaid++;
        if (dueDate && dueDate < now) {
          stats.overdue++;
        }
      } else if (invoice.paymentStatus === 'partially_paid') {
        stats.partiallyPaid++;
      }
    });

    return stats;
  }, [invoices]);

  // Auto-load invoices on mount
  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  return {
    // State
    invoices,
    selectedInvoice,
    loading,
    error,
    filters,
    pagination,

    // Actions
    loadInvoices,
    loadInvoiceById,
    generateForReservation,
    createManual,
    uploadInvoice,
    recordPayment,
    voidInvoice,
    deleteInvoice,
    downloadInvoice,
    sendInvoice,

    // Filters
    updateFilters,
    clearFilters,

    // Utilities
    setSelectedInvoice,
    calculateStatistics
  };
};
