import { useState, useCallback } from 'react';
import { auditAPI } from '../services/api';

/**
 * Custom hook for Audit Logs
 * Handles audit log retrieval and filtering
 */
export const useAuditLogs = () => {
  // State management
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    userId: '',
    action: '',
    limit: 50
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50
  });

  /**
   * Load audit logs with filters
   */
  const loadLogs = useCallback(async (customFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const appliedFilters = { ...filters, ...customFilters };
      const response = await auditAPI.getLogs(appliedFilters);

      if (response.data.success) {
        setLogs(response.data.data.logs);
        setPagination({
          total: response.data.data.total,
          page: response.data.data.page,
          limit: response.data.data.limit
        });
        return response.data.data.logs;
      } else {
        setError(response.data.message || 'Failed to load audit logs');
        return [];
      }
    } catch (err) {
      console.error('Error loading audit logs:', err);
      const errorMsg = err.response?.data?.message || 'Failed to load audit logs';
      setError(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Load audit summary
   */
  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await auditAPI.getSummary();

      if (response.data.success) {
        setSummary(response.data.data);
        return response.data.data;
      } else {
        setError(response.data.message || 'Failed to load audit summary');
        return null;
      }
    } catch (err) {
      console.error('Error loading audit summary:', err);
      const errorMsg = err.response?.data?.message || 'Failed to load audit summary';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

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
      startDate: '',
      endDate: '',
      userId: '',
      action: '',
      limit: 50
    });
  }, []);

  /**
   * Filter logs by action type
   */
  const filterByAction = useCallback((action) => {
    updateFilters({ action });
    loadLogs({ action });
  }, [loadLogs, updateFilters]);

  /**
   * Filter logs by date range
   */
  const filterByDateRange = useCallback((startDate, endDate) => {
    updateFilters({ startDate, endDate });
    loadLogs({ startDate, endDate });
  }, [loadLogs, updateFilters]);

  /**
   * Filter logs by user
   */
  const filterByUser = useCallback((userId) => {
    updateFilters({ userId });
    loadLogs({ userId });
  }, [loadLogs, updateFilters]);

  return {
    // State
    logs,
    summary,
    loading,
    error,
    filters,
    pagination,

    // Actions
    loadLogs,
    loadSummary,
    updateFilters,
    clearFilters,
    filterByAction,
    filterByDateRange,
    filterByUser
  };
};
