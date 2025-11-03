import { useState, useCallback } from 'react';
import { analyticsAPI } from '../services/api';

/**
 * Custom hook for Analytics
 * Handles dashboard, occupancy, revenue, and guest analytics
 */
export const useAnalytics = () => {
  // State management
  const [dashboard, setDashboard] = useState(null);
  const [occupancy, setOccupancy] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [guestAnalytics, setGuestAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load dashboard analytics
   */
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await analyticsAPI.getDashboard();

      if (response.data.success) {
        setDashboard(response.data.data);
        return response.data.data;
      } else {
        setError(response.data.message || 'Failed to load dashboard');
        return null;
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      const errorMsg = err.response?.data?.message || 'Failed to load dashboard';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load occupancy analytics
   */
  const loadOccupancy = useCallback(async (startDate, endDate) => {
    setLoading(true);
    setError(null);

    try {
      const response = await analyticsAPI.getOccupancy({ startDate, endDate });

      if (response.data.success) {
        setOccupancy(response.data.data);
        return response.data.data;
      } else {
        setError(response.data.message || 'Failed to load occupancy data');
        return null;
      }
    } catch (err) {
      console.error('Error loading occupancy:', err);
      const errorMsg = err.response?.data?.message || 'Failed to load occupancy data';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load revenue analytics
   */
  const loadRevenue = useCallback(async (startDate, endDate, groupBy = 'month') => {
    setLoading(true);
    setError(null);

    try {
      const response = await analyticsAPI.getRevenue({ startDate, endDate, groupBy });

      if (response.data.success) {
        setRevenue(response.data.data);
        return response.data.data;
      } else {
        setError(response.data.message || 'Failed to load revenue data');
        return null;
      }
    } catch (err) {
      console.error('Error loading revenue:', err);
      const errorMsg = err.response?.data?.message || 'Failed to load revenue data';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load guest analytics
   */
  const loadGuestAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await analyticsAPI.getGuests();

      if (response.data.success) {
        setGuestAnalytics(response.data.data);
        return response.data.data;
      } else {
        setError(response.data.message || 'Failed to load guest analytics');
        return null;
      }
    } catch (err) {
      console.error('Error loading guest analytics:', err);
      const errorMsg = err.response?.data?.message || 'Failed to load guest analytics';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load all analytics data
   */
  const loadAll = useCallback(async (startDate, endDate) => {
    setLoading(true);
    setError(null);

    try {
      const [dashboardData, occupancyData, revenueData, guestData] = await Promise.all([
        loadDashboard(),
        loadOccupancy(startDate, endDate),
        loadRevenue(startDate, endDate),
        loadGuestAnalytics()
      ]);

      return {
        dashboard: dashboardData,
        occupancy: occupancyData,
        revenue: revenueData,
        guests: guestData
      };
    } catch (err) {
      console.error('Error loading all analytics:', err);
      const errorMsg = err.response?.data?.message || 'Failed to load analytics';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadDashboard, loadOccupancy, loadRevenue, loadGuestAnalytics]);

  /**
   * Clear all analytics data
   */
  const clearAnalytics = useCallback(() => {
    setDashboard(null);
    setOccupancy(null);
    setRevenue(null);
    setGuestAnalytics(null);
    setError(null);
  }, []);

  return {
    // State
    dashboard,
    occupancy,
    revenue,
    guestAnalytics,
    loading,
    error,

    // Actions
    loadDashboard,
    loadOccupancy,
    loadRevenue,
    loadGuestAnalytics,
    loadAll,
    clearAnalytics
  };
};
