// backend/src/models/StockTransaction.js
// Stock Transaction Model - Tracks all stock movements (IN/OUT/ADJUST)

module.exports = (sequelize, DataTypes) => {
  const StockTransaction = sequelize.define('StockTransaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    inventoryItemId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'inventory_items',
        key: 'id'
      }
    },
    transactionType: {
      type: DataTypes.ENUM('stock_in', 'stock_out', 'adjustment'),
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notZero(value) {
          if (value === 0) {
            throw new Error('Quantity cannot be zero');
          }
        }
      }
    },
    quantityBefore: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    quantityAfter: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    unitCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    totalCost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    supplierName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    invoiceNumber: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    reason: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    usedBy: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    propertyId: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    reservationId: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    guestName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    transactionDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    performedBy: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'admin'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isApproved: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    approvedBy: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'stock_transactions',
    timestamps: true,
    indexes: [
      { fields: ['inventoryItemId'] },
      { fields: ['transactionType'] },
      { fields: ['transactionDate'] },
      { fields: ['performedBy'] },
      { fields: ['propertyId'] },
      { fields: ['reservationId'] }
    ]
  });

  StockTransaction.associate = (models) => {
    StockTransaction.belongsTo(models.InventoryItem, {
      foreignKey: 'inventoryItemId',
      as: 'inventoryItem'
    });
  };

  return StockTransaction;
};
