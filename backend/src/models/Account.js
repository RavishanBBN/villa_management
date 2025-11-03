// =====================================================================
// ACCOUNT MODEL - Chart of Accounts
// =====================================================================

module.exports = (sequelize, DataTypes) => {
  const Account = sequelize.define('Account', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    accountCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: 'Unique account code (e.g., 1000, 2000, 4000)'
    },
    accountName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Account name (e.g., Cash, Accounts Receivable)'
    },
    accountType: {
      type: DataTypes.ENUM(
        'asset',           // Assets (Cash, AR, Inventory)
        'liability',       // Liabilities (AP, Loans)
        'equity',          // Owner's Equity
        'revenue',         // Revenue/Income
        'expense',         // Expenses
        'cost_of_sales'    // Cost of Goods Sold
      ),
      allowNull: false,
      comment: 'Type of account for financial statements'
    },
    category: {
      type: DataTypes.ENUM(
        // Asset categories
        'current_asset',
        'fixed_asset',
        'other_asset',
        // Liability categories
        'current_liability',
        'long_term_liability',
        // Equity categories
        'owner_equity',
        'retained_earnings',
        // Revenue categories
        'operating_revenue',
        'other_revenue',
        // Expense categories
        'operating_expense',
        'administrative_expense',
        'marketing_expense',
        'financial_expense',
        'other_expense',
        // COGS
        'direct_cost'
      ),
      allowNull: false,
      comment: 'Subcategory for detailed reporting'
    },
    parentAccountId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      },
      comment: 'Parent account for hierarchical structure'
    },
    normalBalance: {
      type: DataTypes.ENUM('debit', 'credit'),
      allowNull: false,
      comment: 'Normal balance side (debit or credit)'
    },
    currentBalance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      allowNull: false,
      comment: 'Current balance in base currency'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'LKR',
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    isSystemAccount: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'System accounts cannot be deleted'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    taxApplicable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    reconciliationRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Requires bank reconciliation'
    },
    lastReconciliationDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: 'Additional account properties'
    }
  }, {
    tableName: 'accounts',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['accountCode'] },
      { fields: ['accountType'] },
      { fields: ['category'] },
      { fields: ['parentAccountId'] },
      { fields: ['isActive'] }
    ]
  });

  // Associations
  Account.associate = (models) => {
    // Self-referential for parent-child hierarchy
    Account.hasMany(models.Account, {
      foreignKey: 'parentAccountId',
      as: 'childAccounts'
    });

    Account.belongsTo(models.Account, {
      foreignKey: 'parentAccountId',
      as: 'parentAccount'
    });

    // Journal entries
    Account.hasMany(models.JournalEntry, {
      foreignKey: 'accountId',
      as: 'journalEntries'
    });

    // Transactions
    Account.hasMany(models.Transaction, {
      foreignKey: 'accountId',
      as: 'transactions'
    });
  };

  // Instance Methods
  Account.prototype.updateBalance = async function(amount, type) {
    // Update balance based on normal balance and transaction type
    if (this.normalBalance === 'debit') {
      if (type === 'debit') {
        this.currentBalance = parseFloat(this.currentBalance) + parseFloat(amount);
      } else {
        this.currentBalance = parseFloat(this.currentBalance) - parseFloat(amount);
      }
    } else { // credit
      if (type === 'credit') {
        this.currentBalance = parseFloat(this.currentBalance) + parseFloat(amount);
      } else {
        this.currentBalance = parseFloat(this.currentBalance) - parseFloat(amount);
      }
    }
    await this.save();
  };

  Account.prototype.getHierarchy = async function() {
    const hierarchy = [];
    let current = this;

    while (current.parentAccountId) {
      const parent = await Account.findByPk(current.parentAccountId);
      if (!parent) break;
      hierarchy.unshift(parent);
      current = parent;
    }

    return hierarchy;
  };

  // Class Methods
  Account.getDefaultChartOfAccounts = function() {
    return [
      // ASSETS
      { accountCode: '1000', accountName: 'Cash', accountType: 'asset', category: 'current_asset', normalBalance: 'debit', isSystemAccount: true },
      { accountCode: '1010', accountName: 'Bank Account', accountType: 'asset', category: 'current_asset', normalBalance: 'debit', isSystemAccount: true, reconciliationRequired: true },
      { accountCode: '1020', accountName: 'Accounts Receivable', accountType: 'asset', category: 'current_asset', normalBalance: 'debit', isSystemAccount: true },
      { accountCode: '1030', accountName: 'Inventory', accountType: 'asset', category: 'current_asset', normalBalance: 'debit', isSystemAccount: true },
      { accountCode: '1500', accountName: 'Property & Equipment', accountType: 'asset', category: 'fixed_asset', normalBalance: 'debit', isSystemAccount: true },
      { accountCode: '1510', accountName: 'Accumulated Depreciation', accountType: 'asset', category: 'fixed_asset', normalBalance: 'credit', isSystemAccount: true },

      // LIABILITIES
      { accountCode: '2000', accountName: 'Accounts Payable', accountType: 'liability', category: 'current_liability', normalBalance: 'credit', isSystemAccount: true },
      { accountCode: '2010', accountName: 'Tax Payable', accountType: 'liability', category: 'current_liability', normalBalance: 'credit', isSystemAccount: true },
      { accountCode: '2020', accountName: 'Advance Deposits', accountType: 'liability', category: 'current_liability', normalBalance: 'credit', isSystemAccount: true },
      { accountCode: '2500', accountName: 'Long-term Loans', accountType: 'liability', category: 'long_term_liability', normalBalance: 'credit', isSystemAccount: true },

      // EQUITY
      { accountCode: '3000', accountName: "Owner's Equity", accountType: 'equity', category: 'owner_equity', normalBalance: 'credit', isSystemAccount: true },
      { accountCode: '3010', accountName: 'Retained Earnings', accountType: 'equity', category: 'retained_earnings', normalBalance: 'credit', isSystemAccount: true },

      // REVENUE
      { accountCode: '4000', accountName: 'Room Revenue', accountType: 'revenue', category: 'operating_revenue', normalBalance: 'credit', isSystemAccount: true },
      { accountCode: '4010', accountName: 'Service Revenue', accountType: 'revenue', category: 'operating_revenue', normalBalance: 'credit', isSystemAccount: true },
      { accountCode: '4020', accountName: 'Other Revenue', accountType: 'revenue', category: 'other_revenue', normalBalance: 'credit', isSystemAccount: true },

      // EXPENSES
      { accountCode: '5000', accountName: 'Salaries & Wages', accountType: 'expense', category: 'operating_expense', normalBalance: 'debit', isSystemAccount: true },
      { accountCode: '5010', accountName: 'Utilities', accountType: 'expense', category: 'operating_expense', normalBalance: 'debit', isSystemAccount: true },
      { accountCode: '5020', accountName: 'Maintenance & Repairs', accountType: 'expense', category: 'operating_expense', normalBalance: 'debit', isSystemAccount: true },
      { accountCode: '5030', accountName: 'Housekeeping Supplies', accountType: 'expense', category: 'operating_expense', normalBalance: 'debit', isSystemAccount: true },
      { accountCode: '5100', accountName: 'Marketing & Advertising', accountType: 'expense', category: 'marketing_expense', normalBalance: 'debit', isSystemAccount: true },
      { accountCode: '5200', accountName: 'Administrative Expenses', accountType: 'expense', category: 'administrative_expense', normalBalance: 'debit', isSystemAccount: true },
      { accountCode: '5300', accountName: 'Bank Charges', accountType: 'expense', category: 'financial_expense', normalBalance: 'debit', isSystemAccount: true },
      { accountCode: '5310', accountName: 'Interest Expense', accountType: 'expense', category: 'financial_expense', normalBalance: 'debit', isSystemAccount: true }
    ];
  };

  return Account;
};
