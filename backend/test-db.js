require('dotenv').config();
const { Pool } = require('pg');

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connected successfully');
    console.log('Database time:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error details:', error);
    return false;
  } finally {
    await pool.end();
  }
}

testConnection();