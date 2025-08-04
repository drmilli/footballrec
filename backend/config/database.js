const { Pool } = require('pg');
const logger = require('../utils/logger');

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    logger.info('✅ Database connected successfully');
    logger.info(`Database time: ${result.rows[0].now}`);
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Execute query with error handling
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug(`Query executed in ${duration}ms`);
    return result;
  } catch (error) {
    logger.error('Database query error:', error.message);
    logger.error('Query:', text);
    logger.error('Params:', params);
    throw error;
  }
};

// Get a client from the pool
const getClient = async () => {
  try {
    return await pool.connect();
  } catch (error) {
    logger.error('Failed to get database client:', error.message);
    throw error;
  }
};

// Close all connections
const close = async () => {
  try {
    await pool.end();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database connections:', error.message);
  }
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
  close
};