/**
 * NAWI-R76 Database Migration & Initialization Script
 * Runs against Local PostgreSQL or Supabase
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

async function runMigration() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nawi_r76';
  
  console.log('----------------------------------------------------');
  console.log('NAWI-R76 PostgreSQL & Supabase Database Initializer');
  console.log('----------------------------------------------------');
  console.log(`Connecting to: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);

  const client = new Client({
    connectionString,
    ssl: connectionString.includes('supabase') || connectionString.includes('pooler.supabase.com') || connectionString.includes('render.com') ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL successfully!');

    const sqlPath = path.join(__dirname, '..', 'database', 'supabase_init.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`File not found: ${sqlPath}`);
    }

    console.log(`Executing SQL script: ${sqlPath}...`);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query(sql);
    console.log('All tables, triggers, functions, and seed data applied successfully!');

    // Verify key tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\nVerified Created Tables:');
    res.rows.forEach(r => console.log(`  - ${r.table_name}`));

    const countUsers = await client.query('SELECT count(*) FROM users;');
    const countStandards = await client.query('SELECT count(*) FROM reference_standards;');
    const countModels = await client.query('SELECT count(*) FROM instrument_models;');
    
    console.log('\nInitial Seed Records:');
    console.log(`  - Users: ${countUsers.rows[0].count}`);
    console.log(`  - Reference Standards: ${countStandards.rows[0].count}`);
    console.log(`  - Instrument Models: ${countModels.rows[0].count}`);
    console.log('\nDatabase setup complete!');

  } catch (err) {
    console.error('\nDatabase Connection Error:', err.message || err);
    if (err.code === 'ECONNREFUSED' || (err.message && err.message.includes('ECONNREFUSED'))) {
      console.error('\n--> Reason: Local PostgreSQL is NOT installed or running on port 5432 of this desktop.');
      console.error('\nOptions to fix:');
      console.error('1. If you have Supabase, update DATABASE_URL in d:\\SIH\\.env with your Supabase URI.');
      console.error('2. Or paste d:\\SIH\\backend\\database\\supabase_init.sql into the Supabase SQL Editor.');
      console.error('3. If you have a local PostgreSQL server, start the service and make sure port 5432 is open.');
    }
  } finally {
    try {
      await client.end();
    } catch (_) {}
  }
}

runMigration();
