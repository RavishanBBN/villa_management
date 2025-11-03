module.exports = (sequelize, DataTypes) => {
  const Expense = sequelize.define('Expense', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: () => 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    },
    category: {
      type: DataTypes.ENUM('utilities', 'maintenance', 'supplies', 'staff', 'marketing', 'services'),
      allowNull: false
    },
    subcategory: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    amountUSD: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'LKR'
    },
    expenseDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'card', 'bank_transfer', 'online'),
      defaultValue: 'cash'
    },
    vendor: {
      type: DataTypes.STRING,
      allowNull: false
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    invoiceFile: {
      type: DataTypes.STRING,
      allowNull: true
    },
    receiptFile: {
      type: DataTypes.STRING,
      allowNull: true
    },
    approvedBy: {
      type: DataTypes.STRING,
      allowNull: true
    },
    approvedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'paid'),
      defaultValue: 'pending'
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    recurringFrequency: {
      type: DataTypes.ENUM('monthly', 'quarterly', 'yearly'),
      allowNull: true
    },
    nextDueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    budgetCategory: {
      type: DataTypes.STRING,
      allowNull: true
    },
    taxDeductible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'expenses',
    timestamps: true
  });

  return Expense;
};