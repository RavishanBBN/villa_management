// =====================================================================
// ACCOUNTING SERVICE - Automated Journal Entries & Financial Operations
// =====================================================================

const db = require('../models');
const { Transaction, JournalEntry, Account, TaxConfiguration } = db;

class AccountingService {
  /**
   * Record revenue from reservation
   * Debit: Cash/Bank Account
   * Credit: Revenue Account
   * @param {Object} reservation - Reservation object
   * @param {Object} payment - Payment object
   * @param {Object} externalTransaction - Optional Sequelize transaction for external transaction management
   */
  static async recordReservationRevenue(reservation, payment, externalTransaction = null) {
    try {
      const createOptions = externalTransaction ? { transaction: externalTransaction } : {};

      // Generate unique transaction number
      const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      // Calculate exchange rate and base amount
      const exchangeRate = payment.currency === 'LKR' ? 1.0 : (reservation.exchangeRate || 1.0);
      const baseAmount = payment.currency === 'LKR' ? payment.amount : payment.amount * exchangeRate;

      // Create transaction
      const transaction = await Transaction.create({
        transactionNumber,
        transactionType: 'revenue',
        description: `Revenue from Reservation ${reservation.confirmationNumber ||  reservation.reservationNumber}`,
        totalAmount: payment.amount,
        currency: payment.currency || 'LKR',
        exchangeRate,
        baseAmount,
        reservationId: reservation.id,
        paymentId: payment.id,
        userId: payment.userId,
        status: 'completed',
        isAutomated: true,
        sourceSystem: 'reservation_system'
      }, createOptions);

      // Get accounts
      const cashAccount = await Account.findOne({
        where: { accountCode: '1010' },
        ...(externalTransaction && { transaction: externalTransaction })
      }); // Bank Account
      const revenueAccount = await Account.findOne({
        where: { accountCode: '4000' },
        ...(externalTransaction && { transaction: externalTransaction })
      }); // Room Revenue

      if (!cashAccount || !revenueAccount) {
        throw new Error('Required accounts not found. Please initialize chart of accounts.');
      }

      // Create journal entries (Double-entry bookkeeping)
      // Debit: Bank Account (Asset increases)
      await JournalEntry.create({
        transactionId: transaction.id,
        accountId: cashAccount.id,
        entryType: 'debit',
        amount: payment.amount,
        currency: payment.currency || 'LKR',
        exchangeRate,
        baseAmount,
        description: `Payment received for ${reservation.confirmationNumber || reservation.reservationNumber}`
      }, createOptions);

      // Credit: Revenue Account (Revenue increases)
      await JournalEntry.create({
        transactionId: transaction.id,
        accountId: revenueAccount.id,
        entryType: 'credit',
        amount: payment.amount,
        currency: payment.currency || 'LKR',
        exchangeRate,
        baseAmount,
        description: `Revenue from ${reservation.confirmationNumber || reservation.reservationNumber}`
      }, createOptions);

      // Validate balance
      const isBalanced = await JournalEntry.validateBalance(transaction.id);
      if (!isBalanced) {
        throw new Error('Journal entries are not balanced');
      }

      return transaction;
    } catch (error) {
      console.error('Error recording reservation revenue:', error);
      throw error;
    }
  }

  /**
   * Record expense payment
   * Debit: Expense Account
   * Credit: Cash/Bank Account
   */
  static async recordExpense(expense) {
    try {
      const transaction = await Transaction.create({
        transactionType: 'expense',
        description: expense.description || 'Expense payment',
        totalAmount: expense.amount,
        currency: expense.currency || 'LKR',
        expenseId: expense.id,
        userId: expense.userId,
        status: 'completed',
        isAutomated: true,
        sourceSystem: 'expense_system'
      });

      // Get accounts
      const cashAccount = await Account.findOne({ where: { accountCode: '1010' } });

      // Map expense category to account
      const expenseAccountMap = {
        'utilities': '5010',
        'maintenance': '5020',
        'housekeeping': '5030',
        'salaries': '5000',
        'marketing': '5100',
        'administrative': '5200',
        'other': '5200'
      };

      const accountCode = expenseAccountMap[expense.category] || '5200';
      const expenseAccount = await Account.findOne({ where: { accountCode } });

      if (!cashAccount || !expenseAccount) {
        throw new Error('Required accounts not found');
      }

      // Debit: Expense Account (Expense increases)
      await JournalEntry.create({
        transactionId: transaction.id,
        accountId: expenseAccount.id,
        entryType: 'debit',
        amount: expense.amount,
        currency: expense.currency || 'LKR',
        description: expense.description
      });

      // Credit: Bank Account (Asset decreases)
      await JournalEntry.create({
        transactionId: transaction.id,
        accountId: cashAccount.id,
        entryType: 'credit',
        amount: expense.amount,
        currency: expense.currency || 'LKR',
        description: `Payment for ${expense.description}`
      });

      const isBalanced = await JournalEntry.validateBalance(transaction.id);
      if (!isBalanced) {
        throw new Error('Journal entries are not balanced');
      }

      return transaction;
    } catch (error) {
      console.error('Error recording expense:', error);
      throw error;
    }
  }

  /**
   * Record advance deposit from guest
   * Debit: Cash/Bank Account
   * Credit: Advance Deposits (Liability)
   */
  static async recordAdvanceDeposit(reservation, payment) {
    try {
      const transaction = await Transaction.create({
        transactionType: 'advance_deposit',
        description: `Advance deposit for Reservation ${reservation.reservationNumber}`,
        totalAmount: payment.amount,
        currency: payment.currency || 'LKR',
        reservationId: reservation.id,
        paymentId: payment.id,
        userId: payment.userId,
        status: 'completed',
        isAutomated: true,
        sourceSystem: 'reservation_system'
      });

      const cashAccount = await Account.findOne({ where: { accountCode: '1010' } });
      const depositAccount = await Account.findOne({ where: { accountCode: '2020' } }); // Advance Deposits

      // Debit: Bank Account
      await JournalEntry.create({
        transactionId: transaction.id,
        accountId: cashAccount.id,
        entryType: 'debit',
        amount: payment.amount,
        currency: payment.currency || 'LKR',
        description: `Advance deposit received for ${reservation.reservationNumber}`
      });

      // Credit: Advance Deposits Liability
      await JournalEntry.create({
        transactionId: transaction.id,
        accountId: depositAccount.id,
        entryType: 'credit',
        amount: payment.amount,
        currency: payment.currency || 'LKR',
        description: `Advance deposit liability for ${reservation.reservationNumber}`
      });

      const isBalanced = await JournalEntry.validateBalance(transaction.id);
      if (!isBalanced) {
        throw new Error('Journal entries are not balanced');
      }

      return transaction;
    } catch (error) {
      console.error('Error recording advance deposit:', error);
      throw error;
    }
  }

  /**
   * Record refund to guest
   * Debit: Revenue/Liability Account
   * Credit: Cash/Bank Account
   */
  static async recordRefund(reservation, refundAmount, reason) {
    try {
      const transaction = await Transaction.create({
        transactionType: 'refund',
        description: `Refund for Reservation ${reservation.reservationNumber}: ${reason}`,
        totalAmount: refundAmount,
        currency: 'LKR',
        reservationId: reservation.id,
        status: 'completed',
        notes: reason,
        isAutomated: true,
        sourceSystem: 'reservation_system'
      });

      const cashAccount = await Account.findOne({ where: { accountCode: '1010' } });
      const revenueAccount = await Account.findOne({ where: { accountCode: '4000' } });

      // Debit: Revenue Account (Reduce revenue)
      await JournalEntry.create({
        transactionId: transaction.id,
        accountId: revenueAccount.id,
        entryType: 'debit',
        amount: refundAmount,
        description: `Refund: ${reason}`
      });

      // Credit: Bank Account (Cash out)
      await JournalEntry.create({
        transactionId: transaction.id,
        accountId: cashAccount.id,
        entryType: 'credit',
        amount: refundAmount,
        description: `Refund paid for ${reservation.reservationNumber}`
      });

      const isBalanced = await JournalEntry.validateBalance(transaction.id);
      if (!isBalanced) {
        throw new Error('Journal entries are not balanced');
      }

      return transaction;
    } catch (error) {
      console.error('Error recording refund:', error);
      throw error;
    }
  }

  /**
   * Record tax payment
   * Debit: Tax Payable (Liability)
   * Credit: Cash/Bank Account
   */
  static async recordTaxPayment(taxConfig, amount, period) {
    try {
      const transaction = await Transaction.create({
        transactionType: 'tax',
        description: `${taxConfig.taxName} payment for ${period}`,
        totalAmount: amount,
        currency: 'LKR',
        status: 'completed',
        isAutomated: false,
        metadata: {
          taxCode: taxConfig.taxCode,
          period: period
        }
      });

      const cashAccount = await Account.findOne({ where: { accountCode: '1010' } });
      const taxAccount = await Account.findOne({ where: { accountCode: '2010' } }); // Tax Payable

      // Debit: Tax Payable (Reduce liability)
      await JournalEntry.create({
        transactionId: transaction.id,
        accountId: taxAccount.id,
        entryType: 'debit',
        amount: amount,
        description: `${taxConfig.taxName} payment for ${period}`
      });

      // Credit: Bank Account
      await JournalEntry.create({
        transactionId: transaction.id,
        accountId: cashAccount.id,
        entryType: 'credit',
        amount: amount,
        description: `Tax payment: ${taxConfig.taxName}`
      });

      const isBalanced = await JournalEntry.validateBalance(transaction.id);
      if (!isBalanced) {
        throw new Error('Journal entries are not balanced');
      }

      return transaction;
    } catch (error) {
      console.error('Error recording tax payment:', error);
      throw error;
    }
  }

  /**
   * Initialize default chart of accounts
   */
  static async initializeChartOfAccounts() {
    try {
      const defaultAccounts = Account.getDefaultChartOfAccounts();

      for (const accountData of defaultAccounts) {
        await Account.findOrCreate({
          where: { accountCode: accountData.accountCode },
          defaults: accountData
        });
      }

      console.log('Chart of accounts initialized successfully');
      return { success: true, message: 'Chart of accounts initialized' };
    } catch (error) {
      console.error('Error initializing chart of accounts:', error);
      throw error;
    }
  }

  /**
   * Initialize financial system (simplified - no complex tax configs)
   */
  static async initializeFinancialSystem() {
    try {
      // Initialize chart of accounts
      await this.initializeChartOfAccounts();

      console.log('Financial system initialized successfully');
      return {
        success: true,
        message: 'Financial system initialized with chart of accounts',
        note: 'Tax calculations removed as per requirements - use simple percentage rates in invoices'
      };
    } catch (error) {
      console.error('Error initializing financial system:', error);
      throw error;
    }
  }

  /**
   * Generate Profit & Loss Statement
   */
  static async generateProfitLossStatement(startDate, endDate) {
    try {
      const revenueAccounts = await Account.findAll({
        where: { accountType: 'revenue', isActive: true }
      });

      const expenseAccounts = await Account.findAll({
        where: { accountType: 'expense', isActive: true }
      });

      const costAccounts = await Account.findAll({
        where: { accountType: 'cost_of_sales', isActive: true }
      });

      let totalRevenue = 0;
      let totalExpenses = 0;
      let totalCOGS = 0;

      const revenueDetails = [];
      for (const account of revenueAccounts) {
        const balance = await JournalEntry.getAccountBalance(account.id, startDate, endDate);
        const amount = balance.credits - balance.debits; // Revenue has credit balance
        totalRevenue += amount;
        revenueDetails.push({
          accountCode: account.accountCode,
          accountName: account.accountName,
          amount: amount
        });
      }

      const expenseDetails = [];
      for (const account of expenseAccounts) {
        const balance = await JournalEntry.getAccountBalance(account.id, startDate, endDate);
        const amount = balance.debits - balance.credits; // Expenses have debit balance
        totalExpenses += amount;
        expenseDetails.push({
          accountCode: account.accountCode,
          accountName: account.accountName,
          amount: amount
        });
      }

      const cogsDetails = [];
      for (const account of costAccounts) {
        const balance = await JournalEntry.getAccountBalance(account.id, startDate, endDate);
        const amount = balance.debits - balance.credits;
        totalCOGS += amount;
        cogsDetails.push({
          accountCode: account.accountCode,
          accountName: account.accountName,
          amount: amount
        });
      }

      const grossProfit = totalRevenue - totalCOGS;
      const netProfit = grossProfit - totalExpenses;

      return {
        period: { startDate, endDate },
        revenue: {
          total: totalRevenue,
          details: revenueDetails
        },
        costOfSales: {
          total: totalCOGS,
          details: cogsDetails
        },
        grossProfit: grossProfit,
        expenses: {
          total: totalExpenses,
          details: expenseDetails
        },
        netProfit: netProfit,
        profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
      };
    } catch (error) {
      console.error('Error generating P&L statement:', error);
      throw error;
    }
  }

  /**
   * Generate Balance Sheet
   */
  static async generateBalanceSheet(asOfDate = new Date()) {
    try {
      const assetAccounts = await Account.findAll({
        where: { accountType: 'asset', isActive: true }
      });

      const liabilityAccounts = await Account.findAll({
        where: { accountType: 'liability', isActive: true }
      });

      const equityAccounts = await Account.findAll({
        where: { accountType: 'equity', isActive: true }
      });

      let totalAssets = 0;
      let totalLiabilities = 0;
      let totalEquity = 0;

      const assetDetails = [];
      for (const account of assetAccounts) {
        const balance = await JournalEntry.getAccountBalance(account.id, null, asOfDate);
        const amount = account.normalBalance === 'debit'
          ? balance.debits - balance.credits
          : balance.credits - balance.debits;
        totalAssets += amount;
        assetDetails.push({
          accountCode: account.accountCode,
          accountName: account.accountName,
          category: account.category,
          amount: amount
        });
      }

      const liabilityDetails = [];
      for (const account of liabilityAccounts) {
        const balance = await JournalEntry.getAccountBalance(account.id, null, asOfDate);
        const amount = balance.credits - balance.debits; // Liabilities have credit balance
        totalLiabilities += amount;
        liabilityDetails.push({
          accountCode: account.accountCode,
          accountName: account.accountName,
          category: account.category,
          amount: amount
        });
      }

      const equityDetails = [];
      for (const account of equityAccounts) {
        const balance = await JournalEntry.getAccountBalance(account.id, null, asOfDate);
        const amount = balance.credits - balance.debits; // Equity has credit balance
        totalEquity += amount;
        equityDetails.push({
          accountCode: account.accountCode,
          accountName: account.accountName,
          amount: amount
        });
      }

      return {
        asOfDate: asOfDate,
        assets: {
          total: totalAssets,
          details: assetDetails
        },
        liabilities: {
          total: totalLiabilities,
          details: liabilityDetails
        },
        equity: {
          total: totalEquity,
          details: equityDetails
        },
        totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
        isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.02
      };
    } catch (error) {
      console.error('Error generating balance sheet:', error);
      throw error;
    }
  }

  /**
   * Generate Cash Flow Statement
   */
  static async generateCashFlowStatement(startDate, endDate) {
    try {
      const cashAccount = await Account.findOne({ where: { accountCode: '1010' } });

      if (!cashAccount) {
        throw new Error('Cash account not found');
      }

      const journalEntries = await JournalEntry.findAll({
        where: {
          accountId: cashAccount.id,
          createdAt: {
            [db.Sequelize.Op.between]: [startDate, endDate]
          }
        },
        include: [{
          model: Transaction,
          as: 'transaction'
        }],
        order: [['createdAt', 'ASC']]
      });

      let cashFromOperations = 0;
      let cashFromInvesting = 0;
      let cashFromFinancing = 0;

      const operatingActivities = [];
      const investingActivities = [];
      const financingActivities = [];

      for (const entry of journalEntries) {
        const amount = entry.entryType === 'debit'
          ? parseFloat(entry.baseAmount)
          : -parseFloat(entry.baseAmount);

        const activity = {
          date: entry.createdAt,
          description: entry.description,
          amount: amount
        };

        // Categorize by transaction type
        const txnType = entry.transaction.transactionType;

        if (['revenue', 'payment_received', 'expense', 'payment_made', 'salary'].includes(txnType)) {
          cashFromOperations += amount;
          operatingActivities.push(activity);
        } else if (['transfer', 'adjustment'].includes(txnType)) {
          cashFromInvesting += amount;
          investingActivities.push(activity);
        } else {
          cashFromFinancing += amount;
          financingActivities.push(activity);
        }
      }

      const netCashFlow = cashFromOperations + cashFromInvesting + cashFromFinancing;

      return {
        period: { startDate, endDate },
        operating: {
          total: cashFromOperations,
          activities: operatingActivities
        },
        investing: {
          total: cashFromInvesting,
          activities: investingActivities
        },
        financing: {
          total: cashFromFinancing,
          activities: financingActivities
        },
        netCashFlow: netCashFlow
      };
    } catch (error) {
      console.error('Error generating cash flow statement:', error);
      throw error;
    }
  }
}

module.exports = AccountingService;
