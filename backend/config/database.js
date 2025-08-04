const logger = require('../utils/logger');

let pool, query, getClient, close, testConnection;

// Check if we're using SQLite or PostgreSQL
const isSQLite = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('sqlite://');

if (isSQLite) {
  // SQLite configuration
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = process.env.DATABASE_URL.replace('sqlite://', '');
  
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      logger.error('❌ SQLite database connection failed:', err.message);
    } else {
      logger.info('✅ SQLite database connected successfully');
    }
  });

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Test database connection
  testConnection = async () => {
    return new Promise((resolve) => {
      db.get('SELECT datetime("now") as now', (err, row) => {
        if (err) {
          logger.error('❌ SQLite connection test failed:', err.message);
          resolve(false);
        } else {
          logger.info('✅ SQLite connected successfully');
          logger.info(`Database time: ${row.now}`);
          resolve(true);
        }
      });
    });
  };

  // Execute query with error handling
  query = async (text, params = []) => {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      db.run(text, params, function(err) {
        const duration = Date.now() - start;
        if (err) {
          logger.error('SQLite query error:', err.message);
          logger.error('Query:', text);
          logger.error('Params:', params);
          reject(err);
        } else {
          logger.debug(`Query executed in ${duration}ms`);
          resolve({ rows: [], rowCount: this.changes, lastID: this.lastID });
        }
      });
    });
  };

  // Get a client (for SQLite, just return the db instance)
  getClient = async () => {
    return db;
  };

  // Close all connections
  close = async () => {
    return new Promise((resolve) => {
      db.close((err) => {
        if (err) {
          logger.error('Error closing SQLite database:', err.message);
        } else {
          logger.info('SQLite database connection closed');
        }
        resolve();
      });
    });
  };

  pool = db;
} else {
  // PostgreSQL configuration
  const { Pool } = require('pg');

  // Create connection pool
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Test database connection
  testConnection = async () => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();
      logger.info('✅ PostgreSQL connected successfully');
      logger.info(`Database time: ${result.rows[0].now}`);
      return true;
    } catch (error) {
      logger.error('❌ PostgreSQL connection failed:', error.message);
      return false;
    }
  };

  // Execute query with error handling
  query = async (text, params) => {
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
  getClient = async () => {
    try {
      return await pool.connect();
    } catch (error) {
      logger.error('Failed to get database client:', error.message);
      throw error;
    }
  };

  // Close all connections
  close = async () => {
    try {
      await pool.end();
      logger.info('PostgreSQL connections closed');
    } catch (error) {
      logger.error('Error closing PostgreSQL connections:', error.message);
    }
  };
}

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
  close
};