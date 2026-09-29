/**
 * seed.js — populate demo data so the full lifecycle can be exercised
 * immediately after `npm install`. Run with: npm run seed
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { readCollection, writeCollection } = require('./db');

// For a real deployment: set ADMIN_PASSWORD so the admin isn't left with the
// documented default, and SEED_DEMO=false so no demo accounts (with publicly
// known passwords) or sample warehouses are created at all.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Kailash@1209';
const SEED_DEMO = (process.env.SEED_DEMO || 'true').toLowerCase() !== 'false';

async function seedAdminOnly() {
  const admins = await readCollection('admins');
  if (admins.some(a => a.role === 'ADMIN')) {
    console.log('Admin already present, skipping');
    return;
  }
  admins.push({
    id: uuid(), role: 'ADMIN', name: 'Platform Admin', email: 'admin',
    orgName: 'KisanUnnatti', passwordHash: bcrypt.hashSync(ADMIN_PASSWORD, 10),
    status: 'ACTIVE', createdAt: new Date().toISOString()
  });
  await writeCollection('admins', admins);
  console.log('Seeded admin (username: admin) — SEED_DEMO=false, no demo data created');
}

async function seed() {
  if (!SEED_DEMO) return seedAdminOnly();
  const warehouses = await readCollection('warehouses');
  if (warehouses.length === 0) {
    warehouses.push(
      {
        id: uuid(), name: 'Nashik AgriStore WSP-01', wspCmName: 'Nashik Collateral Managers Pvt Ltd',
        district: 'Nashik', state: 'Maharashtra', commodities: ['Soybean', 'Onion', 'Wheat'],
        capacityMT: 5000, availableCapacityMT: 5000, chargesPerMTPerDay: 2.5,
        insuranceValidTill: '2027-03-31', agreementApproved: true, createdAt: new Date().toISOString()
      },
      {
        id: uuid(), name: 'Indore Grain Terminal', wspCmName: 'Central India Warehousing Co.',
        district: 'Indore', state: 'Madhya Pradesh', commodities: ['Soybean', 'Wheat', 'Gram'],
        capacityMT: 8000, availableCapacityMT: 8000, chargesPerMTPerDay: 2.0,
        insuranceValidTill: '2027-06-30', agreementApproved: true, createdAt: new Date().toISOString()
      }
    );
    await writeCollection('warehouses', warehouses);
    console.log('Seeded 2 warehouses');
  } else {
    console.log(`Warehouses: ${warehouses.length} already present, skipping (delete backend/data/ to reseed fresh)`);
  }

  const financers = await readCollection('financers');
  if (financers.length === 0) {
    financers.push({
      id: uuid(), role: 'FINANCER', name: 'Priya Deshmukh', email: 'financer@demo.kisanunnatti.in',
      orgName: 'AgriGrow NBFC', passwordHash: bcrypt.hashSync('Demo@123', 10),
      status: 'ACTIVE', createdAt: new Date().toISOString()
    });
    await writeCollection('financers', financers);
    console.log('Seeded demo financer: financer@demo.kisanunnatti.in / Demo@123');
  } else {
    console.log(`Financers: ${financers.length} already present, skipping — existing login(s): ${financers.map(f => f.email).join(', ')}`);
  }

  const processors = await readCollection('processors');
  if (processors.length === 0) {
    processors.push({
      id: uuid(), role: 'PROCESSOR', name: 'Ramesh Oils', email: 'processor@demo.kisanunnatti.in',
      orgName: 'Ramesh Solvent Extraction', passwordHash: bcrypt.hashSync('Demo@123', 10),
      status: 'ACTIVE', createdAt: new Date().toISOString()
    });
    await writeCollection('processors', processors);
    console.log('Seeded demo processor: processor@demo.kisanunnatti.in / Demo@123');
  } else {
    console.log(`Processors: ${processors.length} already present, skipping — existing login(s): ${processors.map(p => p.email).join(', ')}`);
  }

  const admins = await readCollection('admins');
  if (admins.length === 0) {
    admins.push({
      id: uuid(), role: 'ADMIN', name: 'Platform Admin', email: 'admin',
      orgName: 'KisanUnnatti', passwordHash: bcrypt.hashSync(ADMIN_PASSWORD, 10),
      status: 'ACTIVE', createdAt: new Date().toISOString()
    });
    admins.push({
      id: uuid(), role: 'WSP_CM', name: 'Nashik WSP Operator', email: 'wsp@demo.kisanunnatti.in',
      orgName: 'Nashik Collateral Managers Pvt Ltd', passwordHash: bcrypt.hashSync('Demo@123', 10),
      status: 'ACTIVE', createdAt: new Date().toISOString()
    });
    await writeCollection('admins', admins);
    console.log(`Seeded admin: admin / ${process.env.ADMIN_PASSWORD ? '(password from ADMIN_PASSWORD)' : 'Kailash@1209'}`);
    console.log('Seeded demo WSP/CM: wsp@demo.kisanunnatti.in / Demo@123');
  } else {
    // This is the single most common real-world confusion point: an
    // `admins.json` left over from an earlier version of this project
    // (before the admin login was changed to a plain username) silently
    // keeps whatever credential was seeded back then, since this whole
    // block is skipped whenever the collection isn't empty — with the
    // OLD code, that meant zero console output at all, so there was no
    // way to tell "already seeded, correctly" apart from "already seeded,
    // with something stale" just by watching `npm run seed` run. Printing
    // the actual existing login identifiers, every time, makes a stale
    // admin account visible immediately instead of only after a failed
    // login and a support conversation.
    console.log(`Admins/WSP-CM: ${admins.length} already present, skipping — existing login(s): ${admins.map(a => `${a.role}:${a.email}`).join(', ')}`);
    console.log('  (delete backend/data/ and rerun `npm run seed` if that ADMIN login doesn\'t match what you expect)');
  }

  // Demo farmer — lets "Demo Mode" (Section 13) log straight into the farmer
  // dashboard without a real registration. Bare account, same as the other
  // demo seeds; running the app's flows from here builds up real WR/loan/
  // auction data same as any other farmer.
  const farmers = await readCollection('farmers');
  if (!farmers.some(f => f.mobile === '9000000001')) {
    farmers.push({
      id: uuid(),
      farmerId: 'KU-FMR-DEMO-00000001',
      name: 'Demo Farmer',
      dob: '1985-01-01',
      mobile: '9000000001',
      address: 'Demo address, Nashik',
      kyc: { aadhaarLast4: '0000', pan: 'DEMOF0000D', verifiedAt: new Date().toISOString() },
      bank: { bankAccountNumber: '000000000000', ifsc: 'SBIN0000000', accountHolderName: 'Demo Farmer' },
      location: { village: 'Demo Village', taluka: 'Sinnar', district: 'Nashik', state: 'Maharashtra' },
      preferredCommodities: ['Soybean'],
      passwordHash: bcrypt.hashSync('Demo@123', 10),
      consentAcceptedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'ACTIVE'
    });
    await writeCollection('farmers', farmers);
    console.log('Seeded demo farmer: 9000000001 / Demo@123 (or use Demo Mode)');
  } else {
    console.log('Demo farmer 9000000001 already present, skipping');
  }
}

seed()
  .then(() => { console.log('Seed complete.'); process.exit(0); })
  .catch(err => { console.error('Seed failed:', err); process.exit(1); });
