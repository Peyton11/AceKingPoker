const { Client } = require('pg');
const { execSync } = require('child_process');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME || 'postgres';  // Connect to 'postgres' database first
const DATABASE_TO_CREATE = "poker_db";

const client = new Client({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME, // Default connection to postgres
  port: process.env.DB_PORT || 5432,
});

async function createDatabase() {
  try {
    await client.connect();

    // Check if the database already exists
    const res = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = '${DATABASE_TO_CREATE}'`
    );

    if (res.rowCount === 0) {
      console.log(`Database ${DATABASE_TO_CREATE} does not exist. Creating it now...`);
      // Create the database
      await client.query(`CREATE DATABASE ${DATABASE_TO_CREATE}`);
      console.log(`Database ${DATABASE_TO_CREATE} created successfully.`);

      // Run setupDatabase.js to create schema and tables
      console.log(`Running database schema setup...`);
      execSync('node setupDatabase.js', { stdio: 'inherit' });
    } else {
      console.log(`Database ${DATABASE_TO_CREATE} already exists.`);
    }
  } catch (err) {
    console.error('Error creating database:', err);
  } finally {
    await client.end();
  }
}

createDatabase();
