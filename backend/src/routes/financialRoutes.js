// =====================================================================
// FINANCIAL ROUTES - Automated Accounting & Financial Management
// =====================================================================

const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financialController');
const dataStore = require('../services/dataStore');
const currencyService = require('../services/currencyService');
const { validateRevenueData, validateExpenseData } = require('../middleware/validation');
const { successResponse, errorResponse, notFoundResponse } = require('../utils/responseHelper');

// =====================================================================
// INITIALIZATION ROUTES (New Automated Accounting System)
// =====================================================================

/**
 * @route   POST /api/financial/initialize
 * @desc    Initialize complete financial system (chart of accounts)
 * @access  Private (Admin only)
 */
router.post('/initialize', financialController.initializeFinancialSystem);

/**
 * @route   POST /api/financial/initialize/accounts
 * @desc    Initialize default chart of accounts only
 * @access  Private (Admin only)
 */
router.post('/initialize/accounts', financialController.initializeAccounts);

// =====================================================================
// CHART OF ACCOUNTS (New)
// =====================================================================

/**
 * @route   GET /api/financial/accounts
 * @desc    Get all accounts (Chart of Accounts)
 * @access  Private
 * @query   accountType, category, isActive
 */
router.get('/accounts', financialController.getAllAccounts);

/**
 * @route   POST /api/financial/accounts
 * @desc    Create new account
 * @access  Private (Admin only)
 */
router.post('/accounts', financialController.createAccount);

// =====================================================================
// TRANSACTIONS (New Double-Entry Bookkeeping)
// =====================================================================

/**
 * @route   GET /api/financial/transactions
 * @desc    Get all transactions with pagination
 * @access  Private
 * @query   startDate, endDate, transactionType, status, page, limit
 */
router.get('/transactions', financialController.getAllTransactions);

/**
 * @route   GET /api/financial/transactions/:id
 * @desc    Get transaction by ID with journal entries
 * @access  Private
 */
router.get('/transactions/:id', financialController.getTransactionById);

/**
 * @route   POST /api/financial/transactions/:id/reverse
 * @desc    Reverse a transaction
 * @access  Private (Manager/Admin only)
 */
router.post('/transactions/:id/reverse', financialController.reverseTransaction);

// =====================================================================
// FINANCIAL REPORTS (New - Standard Accounting Reports)
// =====================================================================

/**
 * @route   GET /api/financial/reports/profit-loss
 * @desc    Generate Profit & Loss Statement
 * @access  Private
 * @query   startDate (required), endDate (required)
 */
router.get('/reports/profit-loss', financialController.getProfitLossStatement);

/**
 * @route   GET /api/financial/reports/balance-sheet
 * @desc    Generate Balance Sheet
 * @access  Private
 * @query   asOfDate (optional, defaults to today)
 */
router.get('/reports/balance-sheet', financialController.getBalanceSheet);

/**
 * @route   GET /api/financial/reports/cash-flow
 * @desc    Generate Cash Flow Statement
 * @access  Private
 * @query   startDate (required), endDate (required)
 */
router.get('/reports/cash-flow', financialController.getCashFlowStatement);

// =====================================================================
// BUDGETS (New)
// =====================================================================

/**
 * @route   GET /api/financial/budgets
 * @desc    Get all budgets
 * @access  Private
 * @query   budgetType, status, department
 */
router.get('/budgets', financialController.getAllBudgets);

/**
 * @route   POST /api/financial/budgets
 * @desc    Create new budget
 * @access  Private (Manager/Admin only)
 */
router.post('/budgets', financialController.createBudget);

/**
 * @route   PUT /api/financial/budgets/:id/update-actuals
 * @desc    Update budget actuals from transactions
 * @access  Private
 */
router.put('/budgets/:id/update-actuals', financialController.updateBudgetActuals);

/**
 * @route   POST /api/financial/budgets/:id/approve
 * @desc    Approve budget
 * @access  Private (Admin only)
 */
router.post('/budgets/:id/approve', financialController.approveBudget);

/**
 * @route   GET /api/financial/budgets/summary
 * @desc    Get budget summary for a period
 * @access  Private
 * @query   startDate (required), endDate (required)
 */
router.get('/budgets/summary', financialController.getBudgetSummary);

// =====================================================================
// TAX CONFIGURATIONS (New)
// =====================================================================

// Tax configuration routes removed per user requirements
// Use simple percentage rates in invoices instead

// =====================================================================
// FINANCIAL DASHBOARD (New)
// =====================================================================

/**
 * @route   GET /api/financial/dashboard
 * @desc    Get comprehensive financial dashboard data
 * @access  Private
 * @query   startDate (optional), endDate (optional)
 */
router.get('/dashboard', financialController.getDashboard);

// =====================================================================
// LEGACY ROUTES (Keep for backward compatibility)
// =====================================================================

// Get all revenue entries
router.get('/revenue', (req, res) => {
  const { from, to, type, paymentStatus, currency = 'LKR' } = req.query;

  let filteredRevenue = dataStore.revenueEntries;

  if (from) filteredRevenue = filteredRevenue.filter(r => r.date >= from);
  if (to) filteredRevenue = filteredRevenue.filter(r => r.date <= to);
  if (type) filteredRevenue = filteredRevenue.filter(r => r.type === type);
  if (paymentStatus) filteredRevenue = filteredRevenue.filter(r => r.paymentStatus === paymentStatus);

  const total = filteredRevenue.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const totalUSD = currencyService.convert(total, 'LKR', 'USD');

  return successResponse(res, {
    revenue: filteredRevenue,
    summary: {
      totalLKR: total,
      totalUSD: parseFloat(totalUSD.toFixed(2)),
      count: filteredRevenue.length,
      exchangeRate: currencyService.getRate()
    }
  });
});

// Create revenue entry
router.post('/revenue', validateRevenueData, (req, res) => {
  const {
    type,
    source = 'manual',
    sourceId = null,
    description,
    amount,
    currency = 'LKR',
    date,
    paymentMethod = 'cash',
    paymentStatus = 'completed',
    guestName,
    confirmationNumber,
    tags = [],
    notes
  } = req.body;

  const exchangeRate = currencyService.getRate();
  const amountLKR = currency === 'USD' ? amount * exchangeRate : parseFloat(amount);
  const amountUSD = currency === 'USD' ? parseFloat(amount) : parseFloat(amount) / exchangeRate;

  const revenueEntry = {
    id: 'rev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    type,
    source,
    sourceId,
    description,
    amount: amountLKR,
    amountUSD,
    currency: 'LKR',
    exchangeRate,
    date: date || new Date().toISOString().split('T')[0],
    paymentMethod,
    paymentStatus,
    guestName: guestName || 'N/A',
    confirmationNumber: confirmationNumber || 'N/A',
    tags: Array.isArray(tags) ? tags : [tags].filter(Boolean),
    notes: notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  dataStore.revenueEntries.push(revenueEntry);

  return successResponse(res, revenueEntry, 'Revenue entry created successfully', 201);
});

// Update revenue entry
router.put('/revenue/:id', (req, res) => {
  const { id } = req.params;
  const revenueIndex = dataStore.revenueEntries.findIndex(r => r.id === id);

  if (revenueIndex === -1) {
    return notFoundResponse(res, 'Revenue entry');
  }

  const updates = req.body;
  const revenue = dataStore.revenueEntries[revenueIndex];

  Object.keys(updates).forEach(key => {
    if (key !== 'id' && key !== 'createdAt') {
      revenue[key] = updates[key];
    }
  });

  revenue.updatedAt = new Date().toISOString();

  return successResponse(res, revenue, 'Revenue entry updated successfully');
});

// Delete revenue entry
router.delete('/revenue/:id', (req, res) => {
  const { id } = req.params;
  const revenueIndex = dataStore.revenueEntries.findIndex(r => r.id === id);

  if (revenueIndex === -1) {
    return notFoundResponse(res, 'Revenue entry');
  }

  dataStore.revenueEntries.splice(revenueIndex, 1);

  return successResponse(res, { deleted: true }, 'Revenue entry deleted successfully');
});

// Get all expenses
router.get('/expenses', (req, res) => {
  const { from, to, category, status, vendor } = req.query;

  let filteredExpenses = dataStore.financialExpenses;

  if (from) filteredExpenses = filteredExpenses.filter(e => e.expenseDate >= from);
  if (to) filteredExpenses = filteredExpenses.filter(e => e.expenseDate <= to);
  if (category) filteredExpenses = filteredExpenses.filter(e => e.category === category);
  if (status) filteredExpenses = filteredExpenses.filter(e => e.status === status);
  if (vendor) filteredExpenses = filteredExpenses.filter(e => e.vendor.toLowerCase().includes(vendor.toLowerCase()));

  const total = filteredExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const totalUSD = currencyService.convert(total, 'LKR', 'USD');

  return successResponse(res, {
    expenses: filteredExpenses,
    summary: {
      totalLKR: total,
      totalUSD: parseFloat(totalUSD.toFixed(2)),
      count: filteredExpenses.length,
      byStatus: {
        pending: filteredExpenses.filter(e => e.status === 'pending').length,
        approved: filteredExpenses.filter(e => e.status === 'approved').length,
        paid: filteredExpenses.filter(e => e.status === 'paid').length,
        rejected: filteredExpenses.filter(e => e.status === 'rejected').length
      }
    }
  });
});

// Create expense
router.post('/expenses', validateExpenseData, (req, res) => {
  const {
    category,
    subcategory,
    description,
    amount,
    currency = 'LKR',
    expenseDate,
    paymentMethod,
    vendor,
    invoiceNumber,
    invoiceFile,
    receiptFile,
    isRecurring = false,
    recurringFrequency,
    nextDueDate,
    budgetCategory,
    taxDeductible = true,
    tags = [],
    notes
  } = req.body;

  const exchangeRate = currencyService.getRate();
  const amountLKR = currency === 'USD' ? amount * exchangeRate : parseFloat(amount);
  const amountUSD = currency === 'USD' ? parseFloat(amount) : parseFloat(amount) / exchangeRate;

  const expense = {
    id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    category,
    subcategory: subcategory || null,
    description,
    amount: amountLKR,
    amountUSD,
    currency: 'LKR',
    expenseDate: expenseDate || new Date().toISOString().split('T')[0],
    paymentMethod,
    vendor,
    invoiceNumber,
    invoiceFile,
    receiptFile: receiptFile || null,
    approvedBy: null,
    approvedDate: null,
    status: 'pending',
    isRecurring,
    recurringFrequency: recurringFrequency || null,
    nextDueDate: nextDueDate || null,
    budgetCategory: budgetCategory || category,
    taxDeductible,
    tags: Array.isArray(tags) ? tags : [tags].filter(Boolean),
    notes: notes || '',
    createdBy: 'system',
    createdAt: new Date().toISOString()
  };

  dataStore.financialExpenses.push(expense);

  return successResponse(res, expense, 'Expense created successfully', 201);
});

// Update expense
router.put('/expenses/:id', (req, res) => {
  const { id } = req.params;
  const expenseIndex = dataStore.financialExpenses.findIndex(e => e.id === id);

  if (expenseIndex === -1) {
    return notFoundResponse(res, 'Expense');
  }

  const updates = req.body;
  const expense = dataStore.financialExpenses[expenseIndex];

  Object.keys(updates).forEach(key => {
    if (key !== 'id' && key !== 'createdAt' && key !== 'createdBy') {
      expense[key] = updates[key];
    }
  });

  return successResponse(res, expense, 'Expense updated successfully');
});

// Approve expense
router.patch('/expenses/:id/approve', (req, res) => {
  const { id } = req.params;
  const { approvedBy = 'admin' } = req.body;

  const expenseIndex = dataStore.financialExpenses.findIndex(e => e.id === id);

  if (expenseIndex === -1) {
    return notFoundResponse(res, 'Expense');
  }

  const expense = dataStore.financialExpenses[expenseIndex];
  expense.status = 'approved';
  expense.approvedBy = approvedBy;
  expense.approvedDate = new Date().toISOString();

  return successResponse(res, expense, 'Expense approved successfully');
});

// Delete expense
router.delete('/expenses/:id', (req, res) => {
  const { id } = req.params;
  const expenseIndex = dataStore.financialExpenses.findIndex(e => e.id === id);

  if (expenseIndex === -1) {
    return notFoundResponse(res, 'Expense');
  }

  dataStore.financialExpenses.splice(expenseIndex, 1);

  return successResponse(res, { deleted: true }, 'Expense deleted successfully');
});

// Get profit & loss summary (legacy)
router.get('/summary/profit-loss', (req, res) => {
  const { from, to } = req.query;
  const exchangeRate = currencyService.getRate();

  let revenue = dataStore.revenueEntries;
  let expenses = dataStore.financialExpenses.filter(e => e.status === 'approved' || e.status === 'paid');

  if (from) {
    revenue = revenue.filter(r => r.date >= from);
    expenses = expenses.filter(e => e.expenseDate >= from);
  }

  if (to) {
    revenue = revenue.filter(r => r.date <= to);
    expenses = expenses.filter(e => e.expenseDate <= to);
  }

  const totalRevenue = revenue.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const profit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100) : 0;

  return successResponse(res, {
    period: { from, to },
    revenue: {
      totalLKR: totalRevenue,
      totalUSD: parseFloat((totalRevenue / exchangeRate).toFixed(2)),
      count: revenue.length
    },
    expenses: {
      totalLKR: totalExpenses,
      totalUSD: parseFloat((totalExpenses / exchangeRate).toFixed(2)),
      count: expenses.length
    },
    profit: {
      totalLKR: profit,
      totalUSD: parseFloat((profit / exchangeRate).toFixed(2)),
      margin: parseFloat(profitMargin.toFixed(2))
    },
    exchangeRate
  });
});

// Financial summary (legacy alias for profit-loss)
router.get('/summary', (req, res) => {
  const { startDate, endDate } = req.query;
  const exchangeRate = currencyService.getRate();

  let revenue = dataStore.revenueEntries;
  let expenses = dataStore.financialExpenses.filter(e => e.status === 'approved' || e.status === 'paid');

  if (startDate) {
    revenue = revenue.filter(r => r.date >= startDate);
    expenses = expenses.filter(e => e.expenseDate >= startDate);
  }
  if (endDate) {
    revenue = revenue.filter(r => r.date <= endDate);
    expenses = expenses.filter(e => e.expenseDate <= endDate);
  }

  const totalRevenue = revenue.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const profit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  return successResponse(res, {
    period: {
      startDate: startDate || 'all',
      endDate: endDate || 'now'
    },
    revenue: {
      totalLKR: totalRevenue,
      totalUSD: parseFloat((totalRevenue / exchangeRate).toFixed(2)),
      count: revenue.length
    },
    expenses: {
      totalLKR: totalExpenses,
      totalUSD: parseFloat((totalExpenses / exchangeRate).toFixed(2)),
      count: expenses.length
    },
    profit: {
      totalLKR: profit,
      totalUSD: parseFloat((profit / exchangeRate).toFixed(2)),
      margin: parseFloat(profitMargin.toFixed(2)),
      marginPercentage: `${profitMargin.toFixed(2)}%`
    },
    exchangeRate
  });
});

module.exports = router;
