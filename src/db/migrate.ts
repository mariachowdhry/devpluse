import fs from 'fs';
import path from 'path';
import { pool } from '../config/db';

/**
 * Simple migration runner: executes schema.sql against the configured database.
 * Run with: npm run migrate
 */
async function migrate(): Promise<void> {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  console.log('Running migrations...');
  try {
    await pool.query(schemaSql);
    console.log('✅ Migrations applied successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
