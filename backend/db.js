/**
 * db.js
 * -----
 * Driver selector. Every route file calls readCollection/writeCollection/
 * appendAudit/ensureStore from here — never from db.json.js or
 * db.postgres.js directly — so switching storage is a one-line env change,
 * not a code change.
 *
 * DB_DRIVER=json (default)     -> db.json.js, JSON files under backend/data/
 * DB_DRIVER=postgres           -> db.postgres.js, needs DATABASE_URL set
 *   and migrations applied first (`npm run migrate`).
 *
 * Every exported function is now `async` (see db.postgres.js's own comment
 * for why that couldn't be avoided while genuinely moving to Postgres).
 * The JSON driver's functions still return plain values rather than
 * Promises internally, but `await somePlainValue` resolves immediately to
 * that same value, so route code written as `await readCollection(...)`
 * works unchanged against either driver.
 */
const driver = process.env.DB_DRIVER || 'json';

module.exports = driver === 'postgres' ? require('./db.postgres') : require('./db.json');
