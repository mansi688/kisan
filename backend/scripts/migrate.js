/**
 * scripts/migrate.js
 * ------------------
 * A deliberately small migration runner: no ORM, no binary downloads (see
 * the note in README's "Database (Postgres)" section on why Prisma's
 * engine binaries aren't used here) — just the `pg` driver applying the
 * .sql files in migrations/ in filename order, tracked in a `_migrations`
 * table so re-running this is always safe (already-applied files are
 * skipped).
 *
 * Usage: DATABASE_URL=postgres://... node scripts/migrate.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set — see backend/.env.example.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        filename TEXT PRIMARY KEY,
        "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const applied = new Set(
      (await pool.query('SELECT filename FROM _migrations')).rows.map(r => r.filename)
    );

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    let ran = 0;
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`Applied ${file}`);
        ran++;
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${err.message}`);
      } finally {
        client.release();
      }
    }

    console.log(ran === 0 ? 'Already up to date — nothing to apply.' : `Done — applied ${ran} migration(s).`);
  } finally {
    await pool.end();
  }
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
