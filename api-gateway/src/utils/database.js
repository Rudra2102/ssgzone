// Re-export the singleton DatabaseService so all consumers use the same pool.
// utils/database.js is kept for backward compatibility with existing imports.
module.exports = require('../services/DatabaseService');
