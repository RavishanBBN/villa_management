// =====================================================================
// TRANSACTION MODEL - Financial Transactions
// =====================================================================

module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    transactionNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Unique transaction reference number'
    },
    transactionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Date of the transaction'
    },
    transactionType: {
      type: DataTypes.ENUM(
        'revenue',              // Revenue from bookings
        'payment_received',     // Payment received from guest
        'payment_made',         // Payment made to supplier
        'expense',              // General expense
        'refund',               // Refund to guest
        'transfer',             // Transfer between accounts
        'adjustment',           // Adjustment entry
        'depreciation',         // Depreciation entry
        'tax',                  // Tax payment
        'salary',               // Salary payment
        'advance_deposit',      // Advance deposit from guest
        'other'
      ),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Transaction description'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: 'Total transaction amount'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'LKR',
      allowNull: false
    },
    exchangeRate: {
      type: DataTypes.DECIMAL(10, 6),
      defaultValue: 1.0,
      allowNull: false
    },
    baseAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: 'Amount in base currency'
    },
    // References
    reservationId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'reservations',
        key: 'id'
      },
      comment: 'Related reservation'
    },
    invoiceId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'invoices',
        key: 'id'
      },
      comment: 'Related invoice'
    },
    paymentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'payments',
        key: 'id'
      },
      comment: 'Related payment'
    },
    expenseId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'expenses',
        key: 'id'
      },
      comment: 'Related expense'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who created the transaction'
    },
    // Status
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'reversed', 'cancelled'),
      defaultValue: 'completed',
      allowNull: false
    },
    isReconciled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether transaction has been reconciled'
    },
    reconciledAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reconciledBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // Tax Information
    taxAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      allowNull: false
    },
    taxRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00,
      allowNull: false
    },
    // Additional Info
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    attachments: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'File attachments'
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: 'Additional transaction metadata'
    },
    // Audit
    isAutomated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether transaction was auto-generated'
    },
    sourceSystem: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'System that generated the transaction'
    }
  }, {
    tableName: 'transactions',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['transactionNumber'] },
      { fields: ['transactionDate'] },
      { fields: ['transactionType'] },
      { fields: ['status'] },
      { fields: ['reservationId'] },
      { fields: ['invoiceId'] },
      { fields: ['paymentId'] },
      { fields: ['expenseId'] },
      { fields: ['isReconciled'] },
      { fields: ['userId'] }
    ],
    hooks: {
      beforeCreate: async (transaction) => {
        // Generate transaction number if not provided
        if (!transaction.transactionNumber) {
          const date = new Date();
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');

          // Get count of transactions this month
          const count = await Transaction.count({
            where: {
              transactionNumber: {
                [sequelize.Sequelize.Op.like]: `TXN-${year}${month}-%`
              }
            }
          });

          transaction.transactionNumber = `TXN-${year}${month}-${String(count + 1).padStart(4, '0')}`;
        }

        // Calculate base amount
        if (!transaction.baseAmount) {
          transaction.baseAmount = parseFloat(transaction.totalAmount) * parseFloat(transaction.exchangeRate);
        }
      }
    }
  });

  // Associations
  Transaction.associate = (models) => {
    Transaction.belongsTo(models.Reservation, {
      foreignKey: 'reservationId',
      as: 'reservation'
    });

    Transaction.belongsTo(models.Invoice, {
      foreignKey: 'invoiceId',
      as: 'invoice'
    });

    Transaction.belongsTo(models.Payment, {
      foreignKey: 'paymentId',
      as: 'payment'
    });

    Transaction.belongsTo(models.Expense, {
      foreignKey: 'expenseId',
      as: 'expense'
    });

    Transaction.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'createdBy'
    });

    Transaction.belongsTo(models.User, {
      foreignKey: 'reconciledBy',
      as: 'reconciledByUser'
    });

    Transaction.hasMany(models.JournalEntry, {
      foreignKey: 'transactionId',
      as: 'journalEntries'
    });
  };

  // Instance Methods
  Transaction.prototype.reverse = async function(userId, reason) {
    if (this.status === 'reversed') {
      throw new Error('Transaction is already reversed');
    }

    // Create reversal transaction
    const reversalData = {
      transactionType: this.transactionType,
      description: `REVERSAL: ${this.description}`,
      totalAmount: this.totalAmount,
      currency: this.currency,
      exchangeRate: this.exchangeRate,
      baseAmount: this.baseAmount,
      reservationId: this.reservationId,
      invoiceId: this.invoiceId,
      userId: userId,
      status: 'completed',
      notes: `Reversal of ${this.transactionNumber}. Reason: ${reason}`,
      metadata: {
        reversalOf: this.id,
        reversalReason: reason
      }
    };

    const JournalEntry = sequelize.models.JournalEntry;

    // Get original journal entries
    const originalEntries = await JournalEntry.findAll({
      where: { transactionId: this.id }
    });

    // Create reversal transaction
    const reversal = await Transaction.create(reversalData);

    // Create opposite journal entries
    for (const entry of originalEntries) {
      await JournalEntry.create({
        transactionId: reversal.id,
        accountId: entry.accountId,
        entryType: entry.entryType === 'debit' ? 'credit' : 'debit',
        amount: entry.amount,
        currency: entry.currency,
        exchangeRate: entry.exchangeRate,
        baseAmount: entry.baseAmount,
        description: `Reversal: ${entry.description}`
      });
    }

    // Mark original as reversed
    this.status = 'reversed';
    this.notes = (this.notes || '') + `\nReversed on ${new Date().toISOString()} by user ${userId}. Reason: ${reason}`;
    this.metadata = { ...this.metadata, reversedBy: reversal.id };
    await this.save();

    return reversal;
  };

  Transaction.prototype.reconcile = async function(userId) {
    this.isReconciled = true;
    this.reconciledAt = new Date();
    this.reconciledBy = userId;
    await this.save();
  };

  // Class Methods
  Transaction.generateTransactionNumber = async function() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    const count = await this.count({
      where: {
        transactionNumber: {
          [sequelize.Sequelize.Op.like]: `TXN-${year}${month}-%`
        }
      }
    });

    return `TXN-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  };

  return Transaction;
};
