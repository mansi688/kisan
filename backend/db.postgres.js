/**
 * db.postgres.js
 * --------------
 * Same exported API as db.json.js (readCollection, writeCollection,
 * appendAudit, ensureStore) so route files don't change — see db.js for how
 * the driver is selected, and README's "Database (Postgres)" section for
 * why this is `pg` + hand-written SQL rather than an ORM.
 *
 * IMPORTANT DIFFERENCE FROM THE JSON DRIVER: these functions are now
 * async (real network I/O to Postgres, unlike a synchronous file read).
 * Every route handler in this codebase has been updated to be `async` and
 * `await` these calls (see utils/asyncHandler.js) — that part of the
 * migration could not be avoided by keeping the "same signature": a
 * network database is inherently asynchronous, and no amount of adapter
 * cleverness changes that. `await` on the JSON driver's plain (non-Promise)
 * return values still works correctly, so the same route code runs
 * against either driver.
 */
const { Pool } = require('pg');

// Deliberately NOT overriding pg's default timestamp parsing here: pg parses
// timestamptz/timestamp columns into JS Date objects, and Date has its own
// toJSON() that produces exactly the same "...T...Z" ISO string the JSON
// driver always wrote — so res.json() on a row from either driver looks
// byte-identical over the wire. (An earlier version of this file passed the
// raw driver string through instead, which is Postgres's own
// space-separated timestamp format, not ISO — a real, visible difference
// this fixes.)

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/** Column list per collection/table, in the exact JS-object key order used throughout the routes. */
const COLUMNS = {
  farmers: ['id', 'farmerId', 'name', 'dob', 'mobile', 'address', 'kyc', 'bank', 'location', 'preferredCommodities', 'passwordHash', 'consentAcceptedAt', 'createdAt', 'status'],
  warehouses: ['id', 'name', 'wspCmName', 'district', 'state', 'commodities', 'capacityMT', 'availableCapacityMT', 'chargesPerMTPerDay', 'insuranceValidTill', 'agreementApproved', 'createdAt'],
  bookings: ['id', 'bookingRef', 'farmerId', 'warehouseId', 'commodity', 'estimatedQuantityMT', 'status', 'createdAt'],
  stockIntakes: ['id', 'intakeRef', 'bookingId', 'warehouseId', 'bags', 'grossWeightKg', 'tareWeightKg', 'netWeightKg', 'qualityParams', 'totalRejectPct', 'eligibleQuantityKg', 'eligibleQuantityMT', 'status', 'recordedAt', 'approvedBy', 'approvedAt'],
  warehouseReceipts: ['id', 'wrNumber', 'farmerId', 'warehouseId', 'stockIntakeId', 'commodity', 'grade', 'quantityMT', 'valuation', 'insuranceRef', 'lienStatus', 'financerId', 'status', 'createdAt'],
  financingOffers: ['id', 'wrId', 'financerId', 'amount', 'interestRatePct', 'processingFee', 'otherCharges', 'tenureMonths', 'conditions', 'effectiveCostScore', 'status', 'submittedAt', 'selectedAt'],
  loans: ['id', 'loanRef', 'wrId', 'farmerId', 'financerId', 'offerId', 'principal', 'interestRatePct', 'processingFee', 'otherCharges', 'disbursementDate', 'maturityDate', 'status', 'createdAt', 'closedAt'],
  exposureSnapshots: ['id', 'loanId', 'asOf', 'principal', 'accruedInterest', 'storageCharges', 'totalExposure', 'originalWrValue', 'ceiling', 'utilisationPct', 'status', 'maturityDate', 'daysToMaturity'],
  auctions: ['id', 'auctionId', 'wrId', 'farmerId', 'commodity', 'quantityMT', 'quality', 'warehouseId', 'windowOpensAt', 'windowClosesAt', 'status', 'h1BidId', 'createdAt'],
  bids: ['id', 'auctionId', 'processorId', 'pricePerMT', 'totalValue', 'submittedAt'],
  decisions: ['id', 'auctionId', 'farmerId', 'decision', 'decidedAt'],
  settlements: ['id', 'settlementRef', 'auctionId', 'wrId', 'loanId', 'farmerId', 'processorId', 'farmerPayable', 'steps', 'isShortfall', 'status', 'settledAt', 'settledBy'],
  processors: ['id', 'role', 'name', 'email', 'orgName', 'passwordHash', 'status', 'createdAt'],
  financers: ['id', 'role', 'name', 'email', 'orgName', 'passwordHash', 'status', 'createdAt'],
  admins: ['id', 'role', 'name', 'email', 'orgName', 'passwordHash', 'status', 'createdAt'],
  notifications: ['id', 'recipientId', 'type', 'payload', 'read', 'createdAt'],
  auditLog: ['id', 'timestamp', 'actor', 'action', 'entity', 'entityId', 'meta'],
  contactMessages: ['id', 'name', 'email', 'subject', 'message', 'status', 'createdAt']
};

function quotedTable(name) {
  // auditLog and stockIntakes etc. need double-quoting in SQL because of the
  // capital letters (Postgres folds unquoted identifiers to lowercase).
  return `"${name}"`;
}
function col(c) { return `"${c}"`; }

// pg's automatic parameter serialization treats a JS Array as a native
// Postgres array literal (for TEXT[] columns like `commodities`) — which is
// exactly wrong for a JSONB column whose value happens to be an array (e.g.
// settlements.steps, a list of waterfall step objects). Every JSONB column
// needs an explicit JSON.stringify; every other column (including the real
// TEXT[] ones) is left for pg to serialize as it already does correctly.
const JSONB_COLUMNS = {
  farmers: ['kyc', 'bank', 'location'],
  stockIntakes: ['qualityParams'],
  warehouseReceipts: ['valuation'],
  settlements: ['steps'],
  auditLog: ['meta'],
  notifications: ['payload']
};

function toParamValue(name, c, value) {
  if (value === undefined) return null;
  if (value !== null && (JSONB_COLUMNS[name] || []).includes(c)) return JSON.stringify(value);
  return value;
}

async function readCollection(name) {
  const cols = COLUMNS[name];
  if (!cols) throw new Error(`Unknown collection: ${name}`);
  const res = await pool.query(`SELECT * FROM ${quotedTable(name)}`);
  return res.rows;
}

/**
 * Upserts every record by id, then deletes any row whose id is no longer
 * present — this reproduces the JSON driver's "whole-array-in, whole-file-
 * out" semantics that every route already relies on, but as a single
 * transaction instead of a full file rewrite, so it's safe under
 * concurrent requests.
 */
async function writeCollection(name, records) {
  const cols = COLUMNS[name];
  if (!cols) throw new Error(`Unknown collection: ${name}`);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (records.length > 0) {
      const colList = cols.map(col).join(', ');
      const updateList = cols.filter(c => c !== 'id').map(c => `${col(c)} = EXCLUDED.${col(c)}`).join(', ');
      for (const record of records) {
        const values = cols.map(c => toParamValue(name, c, record[c]));
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        await client.query(
          `INSERT INTO ${quotedTable(name)} (${colList}) VALUES (${placeholders})
           ON CONFLICT (id) DO UPDATE SET ${updateList}`,
          values
        );
      }
      const ids = records.map(r => r.id);
      await client.query(`DELETE FROM ${quotedTable(name)} WHERE id != ALL($1::text[])`, [ids]);
    } else {
      await client.query(`DELETE FROM ${quotedTable(name)}`);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function appendAudit(entry) {
  const { v4: uuid } = require('uuid');
  const record = { id: uuid(), timestamp: new Date().toISOString(), ...entry };
  await pool.query(
    `INSERT INTO "auditLog" (id, timestamp, actor, action, entity, "entityId", meta) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [record.id, record.timestamp, record.actor || null, record.action || null, record.entity || null, record.entityId || null, record.meta ? JSON.stringify(record.meta) : null]
  );
}

/**
 * Postgres driver doesn't create tables here — migrations are a deliberate
 * step (`npm run migrate`), not an implicit side effect of starting the
 * server. This just does a lightweight connectivity check in the
 * background so a misconfigured DATABASE_URL fails loudly in the logs
 * instead of silently on the first request.
 */
function ensureStore() {
  pool.query('SELECT 1').catch(err => {
    console.error('[db.postgres] Could not connect to Postgres — check DATABASE_URL and that migrations have run (`npm run migrate`).', err.message);
  });
}

module.exports = { readCollection, writeCollection, appendAudit, ensureStore, pool };
