module.exports = (sequelize, DataTypes) => {
  const Revenue = sequelize.define('Revenue', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: () => 'rev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    },
    type: {
      type: DataTypes.ENUM('accommodation', 'services', 'other'),
      allowNull: false,
      defaultValue: 'accommodation'
    },
    source: {
      type: DataTypes.ENUM('reservation', 'manual'),
      allowNull: false,
      defaultValue: 'manual'
    },
    sourceId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'properties',
        key: 'id'
      }
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
    exchangeRate: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'card', 'bank_transfer', 'online'),
      defaultValue: 'cash'
    },
    paymentStatus: {
      type: DataTypes.ENUM('completed', 'pending', 'cancelled', 'refunded'),
      defaultValue: 'completed'
    },
    guestName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    confirmationNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'revenues',
    timestamps: true
  });

  Revenue.associate = (models) => {
    Revenue.belongsTo(models.Property, {
      foreignKey: 'propertyId',
      as: 'property'
    });
  };

  return Revenue;
};