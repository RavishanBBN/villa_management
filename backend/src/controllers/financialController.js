// =====================================================================
// FINANCIAL CONTROLLER - Financial Reports & Accounting Operations
// =====================================================================

const db = require('../models');
const accountingService = require('../services/accountingService');
const { Op } = require('sequelize');

/**
 * Initialize Chart of Accounts
 * POST /api/financial/initialize/accounts
 */
exports.initializeAccounts = async (req, res) => {
  try {
    const result = await accountingService.initializeChartOfAccounts();

    res.json({
      success: true,
      message: 'Chart of accounts initialized successfully',
      data: result
    });
  } catch (error) {
    console.error('Error initializing accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize accounts',
      error: error.message
    });
  }
};

/**
 * Initialize Complete Financial System
 * POST /api/financial/initialize
 */
exports.initializeFinancialSystem = async (req, res) => {
  try {
    const result = await accountingService.initializeFinancialSystem();

    res.json({
      success: true,
      message: 'Financial system initialized successfully',
      data: result
    });
  } catch (error) {
    console.error('Error initializing financial system:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize financial system',
      error: error.message
    });
  }
};

/**
 * Get all accounts (Chart of Accounts)
 * GET /api/financial/accounts
 */
exports.getAllAccounts = async (req, res) => {
  try {
    const { accountType, category, isActive } = req.query;

    const where = {};
    if (accountType) where.accountType = accountType;
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const accounts = await db.Account.findAll({
      where,
      order: [['accountCode', 'ASC']],
      include: [{
        model: db.Account,
        as: 'parentAccount',
        attributes: ['id', 'accountCode', 'accountName']
      }]
    });

    res.json({
      success: true,
      data: { accounts }
    });
  } catch (error) {
    console.error('Error getting accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get accounts',
      error: error.message
    });
  }
};

/**
 * Create new account
 * POST /api/financial/accounts
 */
exports.createAccount = async (req, res) => {
  try {
    const account = await db.Account.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { account }
    });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create account',
      error: error.message
    });
  }
};

/**
 * Get all transactions
 * GET /api/financial/transactions
 */
exports.getAllTransactions = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      transactionType,
      status,
      page = 1,
      limit = 50
    } = req.query;

    const where = {};

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate[Op.gte] = new Date(startDate);
      if (endDate) where.transactionDate[Op.lte] = new Date(endDate);
    }

    if (transactionType) where.transactionType = transactionType;
    if (status) where.status = status;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: transactions } = await db.Transaction.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['transactionDate', 'DESC']],
      include: [
        {
          model: db.Reservation,
          as: 'reservation',
          attributes: ['reservationNumber', 'checkInDate', 'checkOutDate']
        },
        {
          model: db.User,
          as: 'createdBy',
          attributes: ['firstName', 'lastName', 'email']
        }
      ]
    });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transactions',
      error: error.message
    });
  }
};

/**
 * Get transaction by ID with journal entries
 * GET /api/financial/transactions/:id
 */
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await db.Transaction.findByPk(req.params.id, {
      include: [
        {
          model: db.JournalEntry,
          as: 'journalEntries',
          include: [{
            model: db.Account,
            as: 'account',
            attributes: ['accountCode', 'accountName', 'accountType']
          }]
        },
        {
          model: db.Reservation,
          as: 'reservation'
        },
        {
          model: db.User,
          as: 'createdBy',
          attributes: ['firstName', 'lastName', 'email']
        }
      ]
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: { transaction }
    });
  } catch (error) {
    console.error('Error getting transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction',
      error: error.message
    });
  }
};

/**
 * Reverse a transaction
 * POST /api/financial/transactions/:id/reverse
 */
exports.reverseTransaction = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reversal reason is required'
      });
    }

    const transaction = await db.Transaction.findByPk(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    const reversal = await transaction.reverse(req.userId, reason);

    res.json({
      success: true,
      message: 'Transaction reversed successfully',
      data: { original: transaction, reversal }
    });
  } catch (error) {
    console.error('Error reversing transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reverse transaction',
      error: error.message
    });
  }
};

/**
 * Generate Profit & Loss Statement
 * GET /api/financial/reports/profit-loss
 */
exports.getProfitLossStatement = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const statement = await accountingService.generateProfitLossStatement(
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      success: true,
      data: statement
    });
  } catch (error) {
    console.error('Error generating P&L statement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate Profit & Loss statement',
      error: error.message
    });
  }
};

/**
 * Generate Balance Sheet
 * GET /api/financial/reports/balance-sheet
 */
exports.getBalanceSheet = async (req, res) => {
  try {
    const { asOfDate } = req.query;

    const date = asOfDate ? new Date(asOfDate) : new Date();

    const balanceSheet = await accountingService.generateBalanceSheet(date);

    res.json({
      success: true,
      data: balanceSheet
    });
  } catch (error) {
    console.error('Error generating balance sheet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate Balance Sheet',
      error: error.message
    });
  }
};

/**
 * Generate Cash Flow Statement
 * GET /api/financial/reports/cash-flow
 */
exports.getCashFlowStatement = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const cashFlow = await accountingService.generateCashFlowStatement(
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      success: true,
      data: cashFlow
    });
  } catch (error) {
    console.error('Error generating cash flow statement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate Cash Flow statement',
      error: error.message
    });
  }
};

/**
 * Get all budgets
 * GET /api/financial/budgets
 */
exports.getAllBudgets = async (req, res) => {
  try {
    const { budgetType, status, department } = req.query;

    const where = {};
    if (budgetType) where.budgetType = budgetType;
    if (status) where.status = status;
    if (department) where.department = department;

    const budgets = await db.Budget.findAll({
      where,
      include: [
        {
          model: db.Account,
          as: 'account',
          attributes: ['accountCode', 'accountName']
        },
        {
          model: db.User,
          as: 'approver',
          attributes: ['firstName', 'lastName']
        }
      ],
      order: [['startDate', 'DESC']]
    });

    res.json({
      success: true,
      data: { budgets }
    });
  } catch (error) {
    console.error('Error getting budgets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get budgets',
      error: error.message
    });
  }
};

/**
 * Create budget
 * POST /api/financial/budgets
 */
exports.createBudget = async (req, res) => {
  try {
    const budget = await db.Budget.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      data: { budget }
    });
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create budget',
      error: error.message
    });
  }
};

/**
 * Update budget actuals
 * PUT /api/financial/budgets/:id/update-actuals
 */
exports.updateBudgetActuals = async (req, res) => {
  try {
    const budget = await db.Budget.findByPk(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    await budget.updateActuals();

    res.json({
      success: true,
      message: 'Budget actuals updated successfully',
      data: { budget }
    });
  } catch (error) {
    console.error('Error updating budget actuals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update budget actuals',
      error: error.message
    });
  }
};

/**
 * Approve budget
 * POST /api/financial/budgets/:id/approve
 */
exports.approveBudget = async (req, res) => {
  try {
    const budget = await db.Budget.findByPk(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    await budget.approve(req.userId);

    res.json({
      success: true,
      message: 'Budget approved successfully',
      data: { budget }
    });
  } catch (error) {
    console.error('Error approving budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve budget',
      error: error.message
    });
  }
};

/**
 * Get budget summary
 * GET /api/financial/budgets/summary
 */
exports.getBudgetSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const summary = await db.Budget.getSummaryByPeriod(
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting budget summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get budget summary',
      error: error.message
    });
  }
};

// Tax configuration endpoints removed per user requirements
// Use simple percentage rates in invoices instead

/**
 * Get financial dashboard data
 * GET /api/financial/dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    // Get P&L
    const profitLoss = await accountingService.generateProfitLossStatement(start, end);

    // Get Balance Sheet
    const balanceSheet = await accountingService.generateBalanceSheet(end);

    // Get Cash Flow
    const cashFlow = await accountingService.generateCashFlowStatement(start, end);

    // Get transaction summary
    const transactions = await db.Transaction.findAll({
      where: {
        transactionDate: {
          [Op.between]: [start, end]
        },
        status: 'completed'
      }
    });

    const transactionSummary = {
      total: transactions.length,
      totalAmount: transactions.reduce((sum, t) => sum + parseFloat(t.baseAmount), 0),
      byType: {}
    };

    transactions.forEach(t => {
      if (!transactionSummary.byType[t.transactionType]) {
        transactionSummary.byType[t.transactionType] = {
          count: 0,
          amount: 0
        };
      }
      transactionSummary.byType[t.transactionType].count++;
      transactionSummary.byType[t.transactionType].amount += parseFloat(t.baseAmount);
    });

    res.json({
      success: true,
      data: {
        period: { startDate: start, endDate: end },
        profitLoss: {
          revenue: profitLoss.revenue.total,
          expenses: profitLoss.expenses.total,
          netProfit: profitLoss.netProfit,
          profitMargin: profitLoss.profitMargin
        },
        balanceSheet: {
          assets: balanceSheet.assets.total,
          liabilities: balanceSheet.liabilities.total,
          equity: balanceSheet.equity.total
        },
        cashFlow: {
          operating: cashFlow.operating.total,
          investing: cashFlow.investing.total,
          financing: cashFlow.financing.total,
          net: cashFlow.netCashFlow
        },
        transactions: transactionSummary
      }
    });
  } catch (error) {
    console.error('Error getting dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get financial dashboard',
      error: error.message
    });
  }
};

module.exports = exports;
