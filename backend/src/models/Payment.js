// src/models/Payment.js
// Simplified version without strict foreign key references

module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    reservationId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.ENUM('LKR', 'USD'),
      allowNull: false
    },
    method: {
      type: DataTypes.ENUM('cash', 'card', 'bank_transfer', 'online'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      defaultValue: 'completed'
    },
    transactionId: {
      type: DataTypes.STRING
    },
    notes: {
      type: DataTypes.TEXT
    },
    paidAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'payments',
    timestamps: true
  });

  Payment.associate = (models) => {
    Payment.belongsTo(models.Reservation, {
      foreignKey: 'reservationId',
      as: 'reservation'
    });
  };

  return Payment;
};