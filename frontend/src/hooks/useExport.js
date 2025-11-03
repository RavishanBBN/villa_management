import { useState, useCallback } from 'react';
import { exportAPI } from '../services/api';

/**
 * Custom hook for handling export operations
 * Manages downloading files (CSV, PDF, JSON) from the backend
 */
export const useExport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to download blob as file
  const downloadBlob = useCallback((blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, []);

  // Export reservations to CSV
  const exportReservations = useCallback(async (startDate = null, endDate = null) => {
    setLoading(true);
    setError(null);

    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await exportAPI.exportReservationsCSV(params);
      const filename = `reservations_${startDate || 'all'}_to_${endDate || 'now'}.csv`;
      downloadBlob(response.data, filename);
      return { success: true, filename };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to export reservations';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [downloadBlob]);

  // Export inventory to CSV
  const exportInventory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await exportAPI.exportInventoryCSV();
      const filename = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
      downloadBlob(response.data, filename);
      return { success: true, filename };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to export inventory';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [downloadBlob]);

  // Export financial report to CSV
  const exportFinancial = useCallback(async (startDate = null, endDate = null) => {
    setLoading(true);
    setError(null);

    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await exportAPI.exportFinancialCSV(params);
      const filename = `financial_${startDate || 'all'}_to_${endDate || 'now'}.csv`;
      downloadBlob(response.data, filename);
      return { success: true, filename };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to export financial report';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [downloadBlob]);

  // Export revenue to CSV
  const exportRevenue = useCallback(async (startDate = null, endDate = null) => {
    setLoading(true);
    setError(null);

    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await exportAPI.exportRevenueCSV(params);
      const filename = `revenue_${startDate || 'all'}_to_${endDate || 'now'}.csv`;
      downloadBlob(response.data, filename);
      return { success: true, filename };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to export revenue';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [downloadBlob]);

  // Export expenses to CSV
  const exportExpenses = useCallback(async (startDate = null, endDate = null) => {
    setLoading(true);
    setError(null);

    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await exportAPI.exportExpensesCSV(params);
      const filename = `expenses_${startDate || 'all'}_to_${endDate || 'now'}.csv`;
      downloadBlob(response.data, filename);
      return { success: true, filename };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to export expenses';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [downloadBlob]);

  // Export profit & loss to CSV
  const exportProfitLoss = useCallback(async (startDate = null, endDate = null) => {
    setLoading(true);
    setError(null);

    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await exportAPI.exportProfitLossCSV(params);
      const filename = `profit_loss_${startDate || 'all'}_to_${endDate || 'now'}.csv`;
      downloadBlob(response.data, filename);
      return { success: true, filename };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to export profit & loss';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [downloadBlob]);

  // Export invoice PDF
  const exportInvoice = useCallback(async (reservationId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await exportAPI.exportInvoicePDF(reservationId);
      const filename = `invoice_${reservationId}.pdf`;
      downloadBlob(response.data, filename);
      return { success: true, filename };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to export invoice';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [downloadBlob]);

  // Export receipt PDF
  const exportReceipt = useCallback(async (reservationId, amount, method) => {
    setLoading(true);
    setError(null);

    try {
      const response = await exportAPI.exportReceiptPDF(reservationId, { amount, method });
      const filename = `receipt_${reservationId}.pdf`;
      downloadBlob(response.data, filename);
      return { success: true, filename };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to export receipt';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [downloadBlob]);

  // Export financial summary JSON
  const exportSummaryJSON = useCallback(async (startDate = null, endDate = null) => {
    setLoading(true);
    setError(null);

    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await exportAPI.exportSummaryJSON(params);
      const jsonString = JSON.stringify(response.data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const filename = `financial_summary_${Date.now()}.json`;
      downloadBlob(blob, filename);
      return { success: true, filename, data: response.data };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to export summary';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [downloadBlob]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    exportReservations,
    exportInventory,
    exportFinancial,
    exportRevenue,
    exportExpenses,
    exportProfitLoss,
    exportInvoice,
    exportReceipt,
    exportSummaryJSON,
    clearError,
  };
};

export default useExport;
