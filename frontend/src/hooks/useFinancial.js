import { useState, useCallback } from 'react';
import { financialAPI } from '../services/api';
import { useAppContext } from '../context/AppContext';

export const useFinancial = () => {
  const { showSuccess, showError, currencyRate } = useAppContext();
  
  // State
  const [revenue, setRevenue] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [financialReports, setFinancialReports] = useState(null);
  const [comprehensiveDashboard, setComprehensiveDashboard] = useState(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastDataUpdate, setLastDataUpdate] = useState(Date.now());

  // Load revenue
  const loadRevenue = useCallback(async () => {
    try {
      const response = await financialAPI.getAllRevenue();
      if (response.data.success) {
        const revenueData = (response.data.data || []).map(item => ({
          ...item,
          amount: parseFloat(item.amount) || 0
        }));
        setRevenue(revenueData);
        console.log('Revenue loaded:', revenueData.length);
        return revenueData;
      }
    } catch (err) {
      console.error('Failed to load revenue:', err);
      setRevenue([]);
      return [];
    }
  }, []);

  // Load expenses
  const loadExpenses = useCallback(async () => {
    try {
      const response = await financialAPI.getAllExpenses();
      if (response.data.success) {
        const expenseData = (response.data.data || []).map(item => ({
          ...item,
          amount: parseFloat(item.amount) || 0
        }));
        setExpenses(expenseData);
        console.log('Expenses loaded:', expenseData.length);
        return expenseData;
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
      setExpenses([]);
      return [];
    }
  }, []);

  // Load pending expenses
  const loadPendingExpenses = useCallback(async () => {
    try {
      const response = await financialAPI.getPendingExpenses();
      if (response.data.success) {
        setPendingExpenses(response.data.data || []);
        console.log('Pending expenses loaded:', response.data.data?.length || 0);
      }
    } catch (err) {
      console.error('Failed to load pending expenses:', err);
      setPendingExpenses([]);
    }
  }, []);

  // Load financial reports
  const loadFinancialReports = useCallback(async () => {
    try {
      const [summaryRes, profitLossRes, cashFlowRes] = await Promise.all([
        financialAPI.getSummary(),
        financialAPI.getProfitLoss(),
        financialAPI.getCashFlow()
      ]);

      if (summaryRes.data.success && profitLossRes.data.success && cashFlowRes.data.success) {
        setFinancialReports({
          summary: summaryRes.data.data,
          profitLoss: profitLossRes.data.data,
          cashFlow: cashFlowRes.data.data
        });
        console.log('Financial reports loaded');
      }
    } catch (err) {
      console.error('Failed to load financial reports:', err);
    }
  }, []);

  // Load comprehensive dashboard
  const loadComprehensiveDashboard = useCallback(async (period = '6months') => {
    setLoading(true);
    try {
      const response = await financialAPI.getDashboard(period, 'monthly');
      
      if (response.data.success) {
        setComprehensiveDashboard(response.data.data);
        console.log('📊 Comprehensive dashboard loaded from server:', response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Server returned no data');
      }
    } catch (err) {
      console.error('❌ Server dashboard failed:', err);
      
      // Fallback: create charts from current data
      const fallbackData = createChartDataFromCurrentState();
      setComprehensiveDashboard(fallbackData);
      return fallbackData;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load real-time metrics
  const loadRealtimeMetrics = useCallback(async () => {
    try {
      const response = await financialAPI.getRealtimeMetrics();
      
      if (response.data.success) {
        setRealtimeMetrics(response.data.data);
        console.log('⚡ Real-time metrics loaded from server');
        return response.data.data;
      } else {
        throw new Error('Server returned no metrics');
      }
    } catch (err) {
      console.error('❌ Server metrics failed, calculating from current data:', err);
      
      // Calculate from current state
      const metrics = calculateMetricsFromCurrentState();
      setRealtimeMetrics(metrics);
      return metrics;
    }
  }, [revenue, expenses]);

  // Helper: Calculate metrics from current state
  const calculateMetricsFromCurrentState = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    
    // Today's metrics
    const todayRevenue = revenue.filter(r => r.date === today).reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    const todayExpenses = expenses.filter(e => e.date === today && e.status === 'approved').reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    
    // Week metrics
    const weekRevenue = revenue.filter(r => r.date >= weekAgo).reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    const weekExpenses = expenses.filter(e => e.date >= weekAgo && e.status === 'approved').reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    
    // Month metrics
    const monthRevenue = revenue.filter(r => r.date >= monthStart).reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    const monthExpenses = expenses.filter(e => e.date >= monthStart && e.status === 'approved').reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    
    return {
      today: {
        revenue: todayRevenue,
        expenses: todayExpenses,
        profit: todayRevenue - todayExpenses,
        transactions: revenue.filter(r => r.date === today).length + expenses.filter(e => e.date === today).length
      },
      thisWeek: {
        revenue: weekRevenue,
        expenses: weekExpenses,
        profit: weekRevenue - weekExpenses
      },
      thisMonth: {
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthRevenue - monthExpenses
      }
    };
  }, [revenue, expenses]);

  // Helper: Create chart data from current state
  const createChartDataFromCurrentState = useCallback(() => {
    // This would include complex chart generation logic
    // For now, return a basic structure
    return {
      timeSeriesData: [],
      revenueBreakdown: [],
      expenseCategories: [],
      paymentMethods: [],
      unitPerformance: [],
      cashFlowAnalysis: []
    };
  }, [revenue, expenses]);

  // Create revenue
  const createRevenue = useCallback(async (data) => {
    setLoading(true);
    try {
      const response = await financialAPI.createRevenue(data);
      if (response.data.success) {
        await loadRevenue();
        await loadRealtimeMetrics();
        showSuccess('Revenue added successfully');
        setLastDataUpdate(Date.now());
        return { success: true, data: response.data.data };
      }
      showError(response.data.message || 'Failed to add revenue');
      return { success: false, error: response.data.message };
    } catch (err) {
      console.error('Failed to create revenue:', err);
      showError('Failed to add revenue');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadRevenue, loadRealtimeMetrics, showSuccess, showError]);

  // Update revenue
  const updateRevenue = useCallback(async (id, data) => {
    setLoading(true);
    try {
      const response = await financialAPI.updateRevenue(id, data);
      if (response.data.success) {
        await loadRevenue();
        await loadRealtimeMetrics();
        showSuccess('Revenue updated successfully');
        setLastDataUpdate(Date.now());
        return { success: true, data: response.data.data };
      }
      showError(response.data.message || 'Failed to update revenue');
      return { success: false, error: response.data.message };
    } catch (err) {
      console.error('Failed to update revenue:', err);
      showError('Failed to update revenue');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadRevenue, loadRealtimeMetrics, showSuccess, showError]);

  // Delete revenue
  const deleteRevenue = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await financialAPI.deleteRevenue(id);
      if (response.data.success) {
        await loadRevenue();
        await loadRealtimeMetrics();
        showSuccess('Revenue deleted successfully');
        setLastDataUpdate(Date.now());
        return { success: true };
      }
      showError(response.data.message || 'Failed to delete revenue');
      return { success: false, error: response.data.message };
    } catch (err) {
      console.error('Failed to delete revenue:', err);
      showError('Failed to delete revenue');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadRevenue, loadRealtimeMetrics, showSuccess, showError]);

  // Create expense
  const createExpense = useCallback(async (data) => {
    setLoading(true);
    try {
      const response = await financialAPI.createExpense(data);
      if (response.data.success) {
        await loadExpenses();
        await loadPendingExpenses();
        await loadRealtimeMetrics();
        showSuccess('Expense added successfully');
        setLastDataUpdate(Date.now());
        return { success: true, data: response.data.data };
      }
      showError(response.data.message || 'Failed to add expense');
      return { success: false, error: response.data.message };
    } catch (err) {
      console.error('Failed to create expense:', err);
      showError('Failed to add expense');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadExpenses, loadPendingExpenses, loadRealtimeMetrics, showSuccess, showError]);

  // Approve/reject expense
  const approveExpense = useCallback(async (expenseId, action, reason = '') => {
    setLoading(true);
    try {
      const response = await financialAPI.approveExpense(expenseId, action, reason);
      if (response.data.success) {
        await loadExpenses();
        await loadPendingExpenses();
        await loadRealtimeMetrics();
        showSuccess(`Expense ${action}d successfully`);
        setLastDataUpdate(Date.now());
        return { success: true };
      }
      showError(response.data.message || `Failed to ${action} expense`);
      return { success: false, error: response.data.message };
    } catch (err) {
      console.error(`Failed to ${action} expense:`, err);
      showError(`Failed to ${action} expense`);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadExpenses, loadPendingExpenses, loadRealtimeMetrics, showSuccess, showError]);

  // Refresh all financial data
  const refreshAllFinancialData = useCallback(async (source = 'Manual') => {
    console.log(`🔄 Refreshing all financial data (${source})...`);
    setLoading(true);
    try {
      await Promise.all([
        loadRevenue(),
        loadExpenses(),
        loadPendingExpenses(),
        loadRealtimeMetrics(),
      ]);
      console.log('✅ All financial data refreshed');
      setLastDataUpdate(Date.now());
    } catch (err) {
      console.error('💥 Failed to refresh financial data:', err);
      showError('Failed to refresh some financial data');
    } finally {
      setLoading(false);
    }
  }, [loadRevenue, loadExpenses, loadPendingExpenses, loadRealtimeMetrics, showError]);

  // Export financial data
  const exportFinancialData = useCallback(async (options) => {
    setLoading(true);
    try {
      const response = await financialAPI.exportFinancialData(options);
      if (response.data.success) {
        showSuccess('Export successful');
        return { success: true, data: response.data.data };
      }
      showError(response.data.message || 'Failed to export data');
      return { success: false, error: response.data.message };
    } catch (err) {
      console.error('Failed to export data:', err);
      showError('Failed to export data');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  return {
    // State
    revenue,
    expenses,
    pendingExpenses,
    financialReports,
    comprehensiveDashboard,
    realtimeMetrics,
    loading,
    error,
    autoRefreshEnabled,
    setAutoRefreshEnabled,
    lastDataUpdate,

    // Functions
    loadRevenue,
    loadExpenses,
    loadPendingExpenses,
    loadFinancialReports,
    loadComprehensiveDashboard,
    loadRealtimeMetrics,
    createRevenue,
    updateRevenue,
    deleteRevenue,
    createExpense,
    approveExpense,
    refreshAllFinancialData,
    exportFinancialData,
  };
};
