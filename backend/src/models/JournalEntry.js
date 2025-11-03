// =====================================================================
// JOURNAL ENTRY MODEL - Double-Entry Bookkeeping
// =====================================================================

module.exports = (sequelize, DataTypes) => {
  const JournalEntry = sequelize.define('JournalEntry', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    transactionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'transactions',
        key: 'id'
      },
      comment: 'Reference to the transaction'
    },
    accountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'accounts',
        key: 'id'
      },
      comment: 'Account being debited or credited'
    },
    entryType: {
      type: DataTypes.ENUM('debit', 'credit'),
      allowNull: false,
      comment: 'Debit or Credit entry'
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0.01
      },
      comment: 'Amount of the entry'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'LKR',
      allowNull: false
    },
    exchangeRate: {
      type: DataTypes.DECIMAL(10, 6),
      defaultValue: 1.0,
      allowNull: false,
      comment: 'Exchange rate if multi-currency'
    },
    baseAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: 'Amount in base currency (LKR)'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description of the journal entry'
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: 'Additional entry metadata'
    }
  }, {
    tableName: 'journal_entries',
    timestamps: true,
    indexes: [
      { fields: ['transactionId'] },
      { fields: ['accountId'] },
      { fields: ['entryType'] },
      { fields: ['createdAt'] }
    ],
    hooks: {
      beforeCreate: async (entry) => {
        // Calculate base amount if exchange rate is provided
        if (entry.exchangeRate && entry.exchangeRate !== 1.0) {
          entry.baseAmount = parseFloat(entry.amount) * parseFloat(entry.exchangeRate);
        } else {
          entry.baseAmount = entry.amount;
        }
      },
      afterCreate: async (entry) => {
        // Update account balance
        const Account = sequelize.models.Account;
        const account = await Account.findByPk(entry.accountId);
        if (account) {
          await account.updateBalance(entry.baseAmount, entry.entryType);
        }
      }
    }
  });

  // Associations
  JournalEntry.associate = (models) => {
    JournalEntry.belongsTo(models.Transaction, {
      foreignKey: 'transactionId',
      as: 'transaction'
    });

    JournalEntry.belongsTo(models.Account, {
      foreignKey: 'accountId',
      as: 'account'
    });
  };

  // Class Methods
  JournalEntry.validateBalance = async function(transactionId) {
    const entries = await this.findAll({
      where: { transactionId }
    });

    const totalDebit = entries
      .filter(e => e.entryType === 'debit')
      .reduce((sum, e) => sum + parseFloat(e.baseAmount), 0);

    const totalCredit = entries
      .filter(e => e.entryType === 'credit')
      .reduce((sum, e) => sum + parseFloat(e.baseAmount), 0);

    const difference = Math.abs(totalDebit - totalCredit);

    // Allow small rounding differences (0.01)
    return difference < 0.02;
  };

  JournalEntry.getAccountBalance = async function(accountId, startDate, endDate) {
    const where = { accountId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[sequelize.Sequelize.Op.gte] = startDate;
      if (endDate) where.createdAt[sequelize.Sequelize.Op.lte] = endDate;
    }

    const entries = await this.findAll({ where });

    const debits = entries
      .filter(e => e.entryType === 'debit')
      .reduce((sum, e) => sum + parseFloat(e.baseAmount), 0);

    const credits = entries
      .filter(e => e.entryType === 'credit')
      .reduce((sum, e) => sum + parseFloat(e.baseAmount), 0);

    return {
      debits,
      credits,
      netBalance: debits - credits
    };
  };

  return JournalEntry;
};
