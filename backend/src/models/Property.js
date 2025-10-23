// src/models/Property.js
// Halcyon Rest Property Model - Corrected

module.exports = (sequelize, DataTypes) => {
  const Property = sequelize.define('Property', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false
    },
    maxAdults: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 4
    },
    maxChildren: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3
    },
    basePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'LKR'
    },
    checkInTime: {
      type: DataTypes.STRING,
      defaultValue: '14:00'
    },
    checkOutTime: {
      type: DataTypes.STRING,
      defaultValue: '11:00'
    },
    amenities: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    description: {
      type: DataTypes.TEXT
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'properties',
    timestamps: true
  });

  Property.associate = (models) => {
    Property.hasMany(models.Reservation, {
      foreignKey: 'propertyId',
      as: 'reservations'
    });
  };

  return Property;
};