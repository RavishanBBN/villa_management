import { useState, useCallback } from 'react';
import { reportAPI } from '../services/api';

/**
 * Custom hook for Reports
 * Handles financial, occupancy, revenue, and guest reports
 */
export const useReports = () => {
  // State management
  const [financialReport, setFinancialReport] = useState(null);
  const [occupancyReport, setOccupancyReport] = useState(null);
  const [revenueReport, setRevenueReport] = useState(null);
  const [guestReport, setGuestReport] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Generate financial report
   */
  const generateFinancialReport = useCallback(async (startDate, endDate, propertyId = null) => {
    setLoading(true);
    setError(null);

    try {
      const params = { startDate, endDate };
      if (propertyId) params.propertyId = propertyId;

      const response = await reportAPI.getFinancial(params);

      if (response.data.success) {
        setFinancialReport(response.data.data);
        return response.data.data;
      } else {
        setError(response.data.message || 'Failed to generate financial report');
        return null;
      }
    } catch (err) {
      console.error('Error generating financial report:', err);
      const errorMsg = err.response?.data?.message || 'Failed to generate financial report';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Generate occupancy report
   */
  const generateOccupancyReport = useCallback(async (startDate, endDate, propertyId = null) => {
    setLoading(true);
    setError(null);

    try {
      const params = { startDate, endDate };
      if (propertyId) params.propertyId = propertyId;

      const response = await reportAPI.getOccupancy(params);

      if (response.data.success) {
        setOccupancyReport(response.data.data);
        return response.data.data;
      } else {
        setError(response.data.message || 'Failed to generate occupancy report');
        return null;
      }
    } catch (err) {
      console.error('Error generating occupancy report:', err);
      const errorMsg = err.response?.data?.message || 'Failed to generate occupancy report';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Generate revenue report
   */
  const generateRevenueReport = useCallback(async (startDate, endDate, groupBy = 'month') => {
    setLoading(true);
    setError(null);

    try {
      const response = await reportAPI.getRevenue({ startDate, endDate, groupBy });

      if (response.data.success) {
        setRevenueReport(response.data.data);
        return response.data.data;
      } else {
        setError(response.data.message || 'Failed to generate revenue report');
        return null;
      }
    } catch (err) {
      console.error('Error generating revenue report:', err);
      const errorMsg = err.response?.data?.message || 'Failed to generate revenue report';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Generate guest report
   */
  const generateGuestReport = useCallback(async (startDate = null, endDate = null) => {
    setLoading(true);
    setError(null);

    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await reportAPI.getGuests(params);

      if (response.data.success) {
        setGuestReport(response.data.data);
        return response.data.data;
      } else {
        setError(response.data.message || 'Failed to generate guest report');
        return null;
      }
    } catch (err) {
      console.error('Error generating guest report:', err);
      const errorMsg = err.response?.data?.message || 'Failed to generate guest report';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Generate monthly report
   */
  const generateMonthlyReport = useCallback(async (month) => {
    setLoading(true);
    setError(null);

    try {
      const response = await reportAPI.getMonthly(month);

      if (response.data.success) {
        setMonthlyReport(response.data.data);
        return response.data.data;
      } else {
        setError(response.data.message || 'Failed to generate monthly report');
        return null;
      }
    } catch (err) {
      console.error('Error generating monthly report:', err);
      const errorMsg = err.response?.data?.message || 'Failed to generate monthly report';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Download report
   */
  const downloadReport = useCallback(async (type, params) => {
    setLoading(true);
    setError(null);

    try {
      const response = await reportAPI.download(type, params);

      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (err) {
      console.error('Error downloading report:', err);
      const errorMsg = err.response?.data?.message || 'Failed to download report';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear all reports
   */
  const clearReports = useCallback(() => {
    setFinancialReport(null);
    setOccupancyReport(null);
    setRevenueReport(null);
    setGuestReport(null);
    setMonthlyReport(null);
    setError(null);
  }, []);

  return {
    // State
    financialReport,
    occupancyReport,
    revenueReport,
    guestReport,
    monthlyReport,
    loading,
    error,

    // Actions
    generateFinancialReport,
    generateOccupancyReport,
    generateRevenueReport,
    generateGuestReport,
    generateMonthlyReport,
    downloadReport,
    clearReports
  };
};
