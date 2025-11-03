// src/models/index.js
// Single source of truth for the DB-connection + model registry

require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

/* ------------------------------------------------------------------
   1.  CONNECTION
   ------------------------------------------------------------------ */
const sequelize = new Sequelize(
  process.env.DB_NAME || 'halcyon_rest_db',
  process.env.DB_USER || 'haclyon_user',       // ← fixed spelling
  process.env.DB_PASS || 'Vn@851015',
  {
    host:     process.env.DB_HOST || 'localhost',
    port:     process.env.DB_PORT || 5432,
    dialect:  'postgres',
    logging:  process.env.NODE_ENV === 'development' ? console.log : false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  }
);

/* ------------------------------------------------------------------
   2.  MODEL REGISTRY
   ------------------------------------------------------------------ */
const db = {};

// Core business models
db.Property = require('./Property')(sequelize, DataTypes);
db.Guest = require('./Guest')(sequelize, DataTypes);
db.Reservation = require('./Reservation')(sequelize, DataTypes);
db.Payment = require('./Payment')(sequelize, DataTypes);
db.InventoryItem = require('./InventoryItem')(sequelize, DataTypes);
db.StockTransaction = require('./StockTransaction')(sequelize, DataTypes);

// Financial models
db.Revenue = require('./Revenue')(sequelize, DataTypes);
db.Expense = require('./Expense')(sequelize, DataTypes);

// Automated Accounting models
db.Account = require('./Account')(sequelize, DataTypes);
db.Transaction = require('./Transaction')(sequelize, DataTypes);
db.JournalEntry = require('./JournalEntry')(sequelize, DataTypes);
db.Budget = require('./Budget')(sequelize, DataTypes);
db.TaxConfiguration = require('./TaxConfiguration')(sequelize, DataTypes);

// System models
db.User = require('./User')(sequelize, DataTypes);
db.Message = require('./Message')(sequelize, DataTypes);

// Invoice/Document model
db.Invoice = require('./Invoice')(sequelize, DataTypes);

// auto-associate if model has .associate()
Object.values(db).forEach(model => {
  if (model.associate) model.associate(db);
});

/* ------------------------------------------------------------------
   3.  UTILITIES
   ------------------------------------------------------------------ */
db.testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅  DB connection OK');
    return true;
  } catch (err) {
    console.error('❌  DB connection failed:', err.message);
    return false;
  }
};

db.initDatabase = async () => {
  await db.testConnection();
  await sequelize.sync({ alter: false }); // change to true if you want auto-DDL in dev
};

/* ------------------------------------------------------------------
   4.  EXPORTS
   ------------------------------------------------------------------ */
db.sequelize = sequelize;
db.Sequelize  = Sequelize;

module.exports = db;