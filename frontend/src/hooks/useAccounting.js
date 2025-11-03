/**
 * useAccounting Hook
 * Custom React hook for managing automated accounting system data
 * Provides access to chart of accounts, transactions, reports, and budgets
 */

import { useState, useEffect, useCallback } from 'react';
import { accountingAPI } from '../services/api';

export const useAccounting = () => {
  // Chart of Accounts State
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState(null);

  // Transactions State
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState(null);

  // Financial Reports State
  const [profitLossStatement, setProfitLossStatement] = useState(null);
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [cashFlowStatement, setCashFlowStatement] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState(null);

  // Budgets State
  const [budgets, setBudgets] = useState([]);
  const [budgetsLoading, setBudgetsLoading] = useState(false);
  const [budgetsError, setBudgetsError] = useState(null);

  // Dashboard State
  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);

  // System Status
  const [isInitialized, setIsInitialized] = useState(false);

  // =================================================================
  // CHART OF ACCOUNTS FUNCTIONS
  // =================================================================

  /**
   * Load all accounts from the Chart of Accounts
   */
  const loadAccounts = useCallback(async (filters = {}) => {
    setAccountsLoading(true);
    setAccountsError(null);
    try {
      const response = await accountingAPI.getAllAccounts(filters);
      setAccounts(response.data.data || []);
      setIsInitialized(true);
      return response.data.data;
    } catch (error) {
      console.error('Error loading accounts:', error);
      setAccountsError(error.response?.data?.message || 'Failed to load accounts');
      if (error.response?.status === 404) {
        setIsInitialized(false);
      }
      throw error;
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  /**
   * Initialize the accounting system with default chart of accounts
   */
  const initializeSystem = useCallback(async () => {
    setAccountsLoading(true);
    setAccountsError(null);
    try {
      const response = await accountingAPI.initializeFinancialSystem();
      await loadAccounts(); // Reload accounts after initialization
      setIsInitialized(true);
      return response.data;
    } catch (error) {
      console.error('Error initializing system:', error);
      setAccountsError(error.response?.data?.message || 'Failed to initialize system');
      throw error;
    } finally {
      setAccountsLoading(false);
    }
  }, [loadAccounts]);

  /**
   * Create a new account
   */
  const createAccount = useCallback(async (accountData) => {
    try {
      const response = await accountingAPI.createAccount(accountData);
      await loadAccounts(); // Reload accounts
      return response.data;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }, [loadAccounts]);

  // =================================================================
  // TRANSACTIONS FUNCTIONS
  // =================================================================

  /**
   * Load all transactions (journal entries)
   */
  const loadTransactions = useCallback(async (filters = {}) => {
    setTransactionsLoading(true);
    setTransactionsError(null);
    try {
      const response = await accountingAPI.getAllTransactions(filters);
      setTransactions(response.data.data || []);
      return response.data.data;
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactionsError(error.response?.data?.message || 'Failed to load transactions');
      throw error;
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  /**
   * Get transaction details with journal entries
   */
  const getTransactionDetails = useCallback(async (transactionId) => {
    try {
      const response = await accountingAPI.getTransactionById(transactionId);
      return response.data.data;
    } catch (error) {
      console.error('Error loading transaction details:', error);
      throw error;
    }
  }, []);

  /**
   * Reverse a transaction
   */
  const reverseTransaction = useCallback(async (transactionId, reason) => {
    try {
      const response = await accountingAPI.reverseTransaction(transactionId, reason);
      await loadTransactions(); // Reload transactions
      return response.data;
    } catch (error) {
      console.error('Error reversing transaction:', error);
      throw error;
    }
  }, [loadTransactions]);

  // =================================================================
  // FINANCIAL REPORTS FUNCTIONS
  // =================================================================

  /**
   * Load Profit & Loss Statement
   */
  const loadProfitLoss = useCallback(async (startDate, endDate) => {
    setReportsLoading(true);
    setReportsError(null);
    try {
      const response = await accountingAPI.getProfitLossStatement(startDate, endDate);
      setProfitLossStatement(response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Error loading P&L statement:', error);
      setReportsError(error.response?.data?.message || 'Failed to load P&L statement');
      throw error;
    } finally {
      setReportsLoading(false);
    }
  }, []);

  /**
   * Load Balance Sheet
   */
  const loadBalanceSheet = useCallback(async (asOfDate) => {
    setReportsLoading(true);
    setReportsError(null);
    try {
      const response = await accountingAPI.getBalanceSheet(asOfDate);
      setBalanceSheet(response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Error loading balance sheet:', error);
      setReportsError(error.response?.data?.message || 'Failed to load balance sheet');
      throw error;
    } finally {
      setReportsLoading(false);
    }
  }, []);

  /**
   * Load Cash Flow Statement
   */
  const loadCashFlow = useCallback(async (startDate, endDate) => {
    setReportsLoading(true);
    setReportsError(null);
    try {
      const response = await accountingAPI.getCashFlowStatement(startDate, endDate);
      setCashFlowStatement(response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Error loading cash flow statement:', error);
      setReportsError(error.response?.data?.message || 'Failed to load cash flow statement');
      throw error;
    } finally {
      setReportsLoading(false);
    }
  }, []);

  /**
   * Load all financial reports
   */
  const loadAllReports = useCallback(async (startDate, endDate, asOfDate = null) => {
    setReportsLoading(true);
    setReportsError(null);
    try {
      const balanceSheetDate = asOfDate || endDate;
      const [pl, bs, cf] = await Promise.all([
        accountingAPI.getProfitLossStatement(startDate, endDate),
        accountingAPI.getBalanceSheet(balanceSheetDate),
        accountingAPI.getCashFlowStatement(startDate, endDate)
      ]);

      setProfitLossStatement(pl.data.data);
      setBalanceSheet(bs.data.data);
      setCashFlowStatement(cf.data.data);

      return {
        profitLoss: pl.data.data,
        balanceSheet: bs.data.data,
        cashFlow: cf.data.data
      };
    } catch (error) {
      console.error('Error loading financial reports:', error);
      setReportsError(error.response?.data?.message || 'Failed to load financial reports');
      throw error;
    } finally {
      setReportsLoading(false);
    }
  }, []);

  // =================================================================
  // BUDGETS FUNCTIONS
  // =================================================================

  /**
   * Load all budgets
   */
  const loadBudgets = useCallback(async (filters = {}) => {
    setBudgetsLoading(true);
    setBudgetsError(null);
    try {
      const response = await accountingAPI.getAllBudgets(filters);
      setBudgets(response.data.data || []);
      return response.data.data;
    } catch (error) {
      console.error('Error loading budgets:', error);
      setBudgetsError(error.response?.data?.message || 'Failed to load budgets');
      throw error;
    } finally {
      setBudgetsLoading(false);
    }
  }, []);

  /**
   * Create a new budget
   */
  const createBudget = useCallback(async (budgetData) => {
    try {
      const response = await accountingAPI.createBudget(budgetData);
      await loadBudgets(); // Reload budgets
      return response.data;
    } catch (error) {
      console.error('Error creating budget:', error);
      throw error;
    }
  }, [loadBudgets]);

  /**
   * Approve a budget
   */
  const approveBudget = useCallback(async (budgetId) => {
    try {
      const response = await accountingAPI.approveBudget(budgetId);
      await loadBudgets(); // Reload budgets
      return response.data;
    } catch (error) {
      console.error('Error approving budget:', error);
      throw error;
    }
  }, [loadBudgets]);

  // =================================================================
  // DASHBOARD FUNCTIONS
  // =================================================================

  /**
   * Load accounting dashboard data
   */
  const loadDashboard = useCallback(async (startDate, endDate) => {
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const response = await accountingAPI.getAccountingDashboard(startDate, endDate);
      setDashboard(response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setDashboardError(error.response?.data?.message || 'Failed to load dashboard');
      throw error;
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  // =================================================================
  // AUTO-LOAD ON MOUNT
  // =================================================================

  useEffect(() => {
    // Try to load accounts on mount to check if system is initialized
    loadAccounts().catch(() => {
      // Silently fail - system not initialized
      setIsInitialized(false);
    });
  }, [loadAccounts]);

  // =================================================================
  // RETURN VALUES
  // =================================================================

  return {
    // Chart of Accounts
    accounts,
    accountsLoading,
    accountsError,
    loadAccounts,
    createAccount,

    // System Initialization
    isInitialized,
    initializeSystem,

    // Transactions
    transactions,
    transactionsLoading,
    transactionsError,
    loadTransactions,
    getTransactionDetails,
    reverseTransaction,

    // Financial Reports
    profitLossStatement,
    balanceSheet,
    cashFlowStatement,
    reportsLoading,
    reportsError,
    loadProfitLoss,
    loadBalanceSheet,
    loadCashFlow,
    loadAllReports,

    // Budgets
    budgets,
    budgetsLoading,
    budgetsError,
    loadBudgets,
    createBudget,
    approveBudget,

    // Dashboard
    dashboard,
    dashboardLoading,
    dashboardError,
    loadDashboard
  };
};

export default useAccounting;
