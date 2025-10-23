import { useState, useCallback } from 'react';
import { dashboardAPI } from '../services/api';

export const useDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardAPI.getStats();
      if (response.data.success) {
        setDashboardData(response.data.data);
        console.log('Dashboard data loaded');
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to load dashboard');
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load KPIs
  const loadKPIs = useCallback(async () => {
    try {
      const response = await dashboardAPI.getKPIs();
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (err) {
      console.error('Failed to load KPIs:', err);
      return null;
    }
  }, []);

  // Load chart data
  const loadChartData = useCallback(async (period = '6months') => {
    try {
      const response = await dashboardAPI.getChartData(period);
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (err) {
      console.error('Failed to load chart data:', err);
      return null;
    }
  }, []);

  return {
    dashboardData,
    loading,
    error,
    loadDashboardData,
    loadKPIs,
    loadChartData,
  };
};
