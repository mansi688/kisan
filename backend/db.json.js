/**
 * db.json.js
 * ----------
 * Minimal file-backed persistence layer.
 *
 * WHY JSON FILES INSTEAD OF A REAL DATABASE FOR PHASE 1
 * The BRD's Suggested Development Phases (section 21) treat Phase 1 as
 * "Core" — farmer KYC, warehouse onboarding, stock intake, valuation, WR
 * and basic dashboards. A JSON store lets the whole lifecycle be built,
 * demoed and unit-tested without any external services, and the entire
 * data-access surface is the four functions below — so swapping this
 * module out for a real PostgreSQL/Prisma layer later (see the
 * production architecture in README.md) touches nothing else in the
 * codebase. Every route file only ever calls readCollection/writeCollection.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

const COLLECTIONS = [
  'farmers', 'warehouses', 'bookings', 'stockIntakes', 'warehouseReceipts',
  'financingOffers', 'loans', 'exposureSnapshots', 'auctions', 'bids',
  'decisions', 'settlements', 'processors', 'financers', 'admins',
  'notifications', 'auditLog', 'contactMessages'
];

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  for (const name of COLLECTIONS) {
    const file = path.join(DATA_DIR, `${name}.json`);
    if (!fs.existsSync(file)) fs.writeFileSync(file, '[]', 'utf-8');
  }
}

function readCollection(name) {
  ensureStore();
  const file = path.join(DATA_DIR, `${name}.json`);
  const raw = fs.readFileSync(file, 'utf-8');
  try {
    return JSON.parse(raw || '[]');
  } catch (e) {
    console.error(`Corrupt JSON in ${name}.json, resetting to []`, e);
    return [];
  }
}

function writeCollection(name, records) {
  ensureStore();
  const file = path.join(DATA_DIR, `${name}.json`);
  // Write to a temp file then rename — avoids truncated/corrupt files if the
  // process is killed mid-write, which matters because financial state lives here.
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(records, null, 2), 'utf-8');
  fs.renameSync(tmp, file);
}

function appendAudit(entry) {
  const log = readCollection('auditLog');
  log.push({
    id: require('uuid').v4(),
    timestamp: new Date().toISOString(),
    ...entry
  });
  writeCollection('auditLog', log);
}

module.exports = { readCollection, writeCollection, appendAudit, ensureStore, DATA_DIR };
