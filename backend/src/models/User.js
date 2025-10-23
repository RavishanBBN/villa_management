// =====================================================================
// USER MODEL - src/models/User.js
// =====================================================================

const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('super_admin', 'admin', 'manager', 'front_desk', 'housekeeping', 'maintenance', 'finance'),
      allowNull: false,
      defaultValue: 'front_desk'
    },
    permissions: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    preferences: {
      type: DataTypes.JSON,
      defaultValue: {
        language: 'en',
        timezone: 'Asia/Colombo',
        currency: 'LKR'
      }
    }
  }, {
    tableName: 'users',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['email'] },
      { unique: true, fields: ['username'] },
      { fields: ['role'] },
      { fields: ['status'] }
    ],
    hooks: {
      // Hash password before creating user
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      // Hash password before updating user (if password changed)
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  // Instance Methods
  User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
  };

  User.prototype.hasPermission = function(permission) {
    if (this.role === 'super_admin') return true;
    return this.permissions && this.permissions.includes(permission);
  };

  User.prototype.updateLastLogin = async function() {
    this.lastLoginAt = new Date();
    await this.save();
  };

  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password; // Never expose password
    return values;
  };

  return User;
};