// =====================================================================
// USER MODEL - src/models/User.js
// =====================================================================

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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
    },
    // Email Verification Fields
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    emailVerificationToken: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    emailVerificationExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    emailVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // 2FA (Two-Factor Authentication) Fields
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    twoFactorSecret: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    twoFactorBackupCodes: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
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
    delete values.emailVerificationToken; // Never expose token
    return values;
  };

  // Generate email verification token
  User.prototype.generateEmailVerificationToken = async function() {
    // Generate random token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Hash token before storing (for security)
    this.emailVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    // Set expiration to 24 hours from now
    this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.save();

    // Return unhashed token (to send in email)
    return verificationToken;
  };

  // Verify email with token
  User.prototype.verifyEmail = async function() {
    this.emailVerified = true;
    this.emailVerifiedAt = new Date();
    this.emailVerificationToken = null;
    this.emailVerificationExpires = null;
    await this.save();
  };

  // Check if verification token is valid
  User.prototype.isVerificationTokenValid = function(token) {
    if (!this.emailVerificationToken || !this.emailVerificationExpires) {
      return false;
    }

    // Check if token has expired
    if (new Date() > this.emailVerificationExpires) {
      return false;
    }

    // Hash the provided token and compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    return hashedToken === this.emailVerificationToken;
  };

  // Generate 2FA secret
  User.prototype.generate2FASecret = function() {
    const speakeasy = require('speakeasy');

    const secret = speakeasy.generateSecret({
      name: `Halcyon Rest (${this.email})`,
      length: 32
    });

    return {
      secret: secret.base32,
      otpauth_url: secret.otpauth_url
    };
  };

  // Enable 2FA
  User.prototype.enable2FA = async function(secret, backupCodes) {
    this.twoFactorSecret = secret;
    this.twoFactorBackupCodes = backupCodes || [];
    this.twoFactorEnabled = true;
    await this.save();
  };

  // Disable 2FA
  User.prototype.disable2FA = async function() {
    this.twoFactorSecret = null;
    this.twoFactorBackupCodes = [];
    this.twoFactorEnabled = false;
    await this.save();
  };

  // Verify 2FA token
  User.prototype.verify2FAToken = function(token) {
    if (!this.twoFactorEnabled || !this.twoFactorSecret) {
      return false;
    }

    const speakeasy = require('speakeasy');

    return speakeasy.totp.verify({
      secret: this.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps before/after for clock skew
    });
  };

  // Verify backup code
  User.prototype.verifyBackupCode = async function(code) {
    if (!this.twoFactorEnabled || !this.twoFactorBackupCodes) {
      return false;
    }

    const index = this.twoFactorBackupCodes.indexOf(code);
    if (index === -1) {
      return false;
    }

    // Remove used backup code
    this.twoFactorBackupCodes.splice(index, 1);
    await this.save();

    return true;
  };

  // Generate backup codes
  User.prototype.generateBackupCodes = function(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  };

  return User;
};