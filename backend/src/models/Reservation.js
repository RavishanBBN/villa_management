// =====================================================================
// RESERVATION MODEL - src/models/Reservation.js
// =====================================================================

module.exports = (sequelize, DataTypes) => {
  const Reservation = sequelize.define('Reservation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    confirmationNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'properties',
        key: 'id'
      }
    },
    guestId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'guests',
        key: 'id'
      }
    },
    checkInDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    checkOutDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    nights: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    adults: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    children: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    childrenAges: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'LKR'
    },
    exchangeRate: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'),
      defaultValue: 'pending'
    },
    paymentStatus: {
      type: DataTypes.ENUM('not_paid', 'advance_payment', 'full_payment', 'refunded'),
      defaultValue: 'not_paid'
    },
    source: {
      type: DataTypes.ENUM('direct', 'booking_com', 'airbnb', 'expedia', 'phone', 'walk_in'),
      defaultValue: 'direct'
    },
    specialRequests: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    guestNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    internalNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    checkedInAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    checkedOutAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    checkedInBy: {
      type: DataTypes.STRING,
      allowNull: true
    },
    checkedOutBy: {
      type: DataTypes.STRING,
      allowNull: true
    },
    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'reservations',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['confirmationNumber'] },
      { fields: ['propertyId'] },
      { fields: ['guestId'] },
      { fields: ['checkInDate'] },
      { fields: ['checkOutDate'] },
      { fields: ['status'] },
      { fields: ['paymentStatus'] }
    ]
  });

  Reservation.associate = (models) => {
    Reservation.belongsTo(models.Property, {
      foreignKey: 'propertyId',
      as: 'property'
    });
    
    Reservation.belongsTo(models.Guest, {
      foreignKey: 'guestId',
      as: 'guest'
    });
    
    Reservation.hasMany(models.Payment, {
      foreignKey: 'reservationId',
      as: 'payments'
    });
  };

  return Reservation;
};
