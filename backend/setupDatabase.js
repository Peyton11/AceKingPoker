const { Client } = require('pg');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_POKER = "poker_db";

const client = new Client({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_POKER,
  port: process.env.DB_PORT || 5432,
});

async function setupDatabase() {
  try {
    await client.connect();
    console.log(`Connected to database ${DB_POKER}, setting up schema...`);

    // Create a sample users table (modify as needed)
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        google_id TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        picture TEXT
      );
    `;
    await client.query(query);
    console.log('Database schema setup completed.');

  } catch (err) {
    console.error('Error setting up database:', err);
  } finally {
    await client.end();
  }
}

setupDatabase();
