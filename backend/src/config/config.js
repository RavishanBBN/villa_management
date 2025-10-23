require('dotenv').config();   // ← single place we load .env

module.exports = {
  [process.env.NODE_ENV || 'development']: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    dialect:  'postgres'
  }
};
