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