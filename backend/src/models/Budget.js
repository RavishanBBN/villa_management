// =====================================================================
// BUDGET MODEL - Budget Planning and Tracking
// =====================================================================

module.exports = (sequelize, DataTypes) => {
  const Budget = sequelize.define('Budget', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    budgetName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Budget name (e.g., "2025 Annual Budget", "Q1 Marketing Budget")'
    },
    budgetType: {
      type: DataTypes.ENUM('annual', 'quarterly', 'monthly', 'project', 'department'),
      allowNull: false
    },
    accountId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      },
      comment: 'Associated account (optional)'
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Budget category (Revenue, Expense, etc.)'
    },
    department: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Department responsible'
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Budget period start date'
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Budget period end date'
    },
    budgetedAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: 'Total budgeted amount'
    },
    actualAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      allowNull: false,
      comment: 'Actual amount spent/earned'
    },
    variance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      allowNull: false,
      comment: 'Variance (actual - budgeted)'
    },
    variancePercent: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00,
      allowNull: false,
      comment: 'Variance percentage'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'LKR',
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'closed', 'archived'),
      defaultValue: 'draft',
      allowNull: false
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: 'Additional budget metadata'
    },
    // Alerts
    alertThreshold: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 80.00,
      allowNull: false,
      comment: 'Alert when actual reaches this % of budget'
    },
    alertSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {
    tableName: 'budgets',
    timestamps: true,
    indexes: [
      { fields: ['budgetType'] },
      { fields: ['accountId'] },
      { fields: ['startDate', 'endDate'] },
      { fields: ['status'] },
      { fields: ['category'] },
      { fields: ['department'] }
    ],
    hooks: {
      beforeSave: async (budget) => {
        // Calculate variance
        budget.variance = parseFloat(budget.actualAmount) - parseFloat(budget.budgetedAmount);

        // Calculate variance percentage
        if (parseFloat(budget.budgetedAmount) > 0) {
          budget.variancePercent = (budget.variance / parseFloat(budget.budgetedAmount)) * 100;
        } else {
          budget.variancePercent = 0;
        }

        // Check if alert should be sent
        const utilizationPercent = (parseFloat(budget.actualAmount) / parseFloat(budget.budgetedAmount)) * 100;
        if (utilizationPercent >= parseFloat(budget.alertThreshold) && !budget.alertSent) {
          budget.alertSent = true;
          // Trigger alert (implement notification service)
        }
      }
    }
  });

  // Associations
  Budget.associate = (models) => {
    Budget.belongsTo(models.Account, {
      foreignKey: 'accountId',
      as: 'account'
    });

    Budget.belongsTo(models.User, {
      foreignKey: 'approvedBy',
      as: 'approver'
    });
  };

  // Instance Methods
  Budget.prototype.updateActuals = async function() {
    const Transaction = sequelize.models.Transaction;
    const JournalEntry = sequelize.models.JournalEntry;

    if (this.accountId) {
      // Calculate actuals from journal entries for this account
      const entries = await JournalEntry.findAll({
        where: {
          accountId: this.accountId,
          createdAt: {
            [sequelize.Sequelize.Op.between]: [this.startDate, this.endDate]
          }
        }
      });

      const debits = entries
        .filter(e => e.entryType === 'debit')
        .reduce((sum, e) => sum + parseFloat(e.baseAmount), 0);

      const credits = entries
        .filter(e => e.entryType === 'credit')
        .reduce((sum, e) => sum + parseFloat(e.baseAmount), 0);

      // For expense accounts, use debits; for revenue accounts, use credits
      const account = await sequelize.models.Account.findByPk(this.accountId);
      if (account) {
        if (account.accountType === 'expense') {
          this.actualAmount = debits;
        } else if (account.accountType === 'revenue') {
          this.actualAmount = credits;
        }
      }
    }

    await this.save();
  };

  Budget.prototype.getUtilizationPercent = function() {
    if (parseFloat(this.budgetedAmount) === 0) return 0;
    return (parseFloat(this.actualAmount) / parseFloat(this.budgetedAmount)) * 100;
  };

  Budget.prototype.getRemainingAmount = function() {
    return parseFloat(this.budgetedAmount) - parseFloat(this.actualAmount);
  };

  Budget.prototype.isOverBudget = function() {
    return parseFloat(this.actualAmount) > parseFloat(this.budgetedAmount);
  };

  Budget.prototype.approve = async function(userId) {
    this.status = 'active';
    this.approvedBy = userId;
    this.approvedAt = new Date();
    await this.save();
  };

  // Class Methods
  Budget.getSummaryByPeriod = async function(startDate, endDate) {
    const budgets = await this.findAll({
      where: {
        startDate: { [sequelize.Sequelize.Op.gte]: startDate },
        endDate: { [sequelize.Sequelize.Op.lte]: endDate },
        status: 'active'
      }
    });

    const totalBudgeted = budgets.reduce((sum, b) => sum + parseFloat(b.budgetedAmount), 0);
    const totalActual = budgets.reduce((sum, b) => sum + parseFloat(b.actualAmount), 0);
    const totalVariance = totalActual - totalBudgeted;

    return {
      totalBudgeted,
      totalActual,
      totalVariance,
      variancePercent: totalBudgeted > 0 ? (totalVariance / totalBudgeted) * 100 : 0,
      budgetCount: budgets.length,
      overBudgetCount: budgets.filter(b => b.isOverBudget()).length
    };
  };

  return Budget;
};
