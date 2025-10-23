
// =====================================================================
// GUEST MODEL - src/models/Guest.js
// =====================================================================

module.exports = (sequelize, DataTypes) => {
  const Guest = sequelize.define('Guest', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    nationality: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    passportNumber: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    passportExpiry: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    address: {
      type: DataTypes.JSON,
      allowNull: true
    },
    emergencyContact: {
      type: DataTypes.JSON,
      allowNull: true
    },
    preferences: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isVip: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    blacklisted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'guests',
    timestamps: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['phone'] },
      { fields: ['passportNumber'] }
    ]
  });

  Guest.associate = (models) => {
    Guest.hasMany(models.Reservation, {
      foreignKey: 'guestId',
      as: 'reservations'
    });
  };

  return Guest;
};

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

// =====================================================================
// PAYMENT MODEL - src/models/Payment.js
// =====================================================================

module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    reservationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'reservations',
        key: 'id'
      }
    },
    amount: {
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
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'card', 'bank_transfer', 'online', 'mobile_payment'),
      allowNull: false
    },
    paymentType: {
      type: DataTypes.ENUM('deposit', 'full_payment', 'balance', 'refund'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled', 'refunded'),
      defaultValue: 'pending'
    },
    transactionId: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    referenceNumber: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    processorResponse: {
      type: DataTypes.JSON,
      allowNull: true
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    processedBy: {
      type: DataTypes.STRING,
      allowNull: true
    },
    failureReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    refundedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refundReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'payments',
    timestamps: true,
    indexes: [
      { fields: ['reservationId'] },
      { fields: ['status'] },
      { fields: ['paymentMethod'] },
      { fields: ['transactionId'] }
    ]
  });

  Payment.associate = (models) => {
    Payment.belongsTo(models.Reservation, {
      foreignKey: 'reservationId',
      as: 'reservation'
    });
  };

  return Payment;
};

// =====================================================================
// INVENTORY ITEM MODEL - src/models/InventoryItem.js
// =====================================================================

module.exports = (sequelize, DataTypes) => {
  const InventoryItem = sequelize.define('InventoryItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('housekeeping', 'kitchen', 'maintenance', 'amenities', 'office', 'other'),
      allowNull: false
    },
    subcategory: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sku: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    currentStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    minStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5
    },
    maxStock: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pieces'
    },
    costPerUnit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    supplierName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    supplierContact: {
      type: DataTypes.JSON,
      allowNull: true
    },
    lastRestocked: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    barcode: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'inventory_items',
    timestamps: true,
    indexes: [
      { fields: ['category'] },
      { fields: ['currentStock'] },
      { fields: ['sku'] },
      { fields: ['isActive'] }
    ]
  });

  InventoryItem.associate = (models) => {
    InventoryItem.hasMany(models.StockTransaction, {
      foreignKey: 'inventoryItemId',
      as: 'transactions'
    });
  };

  return InventoryItem;
};