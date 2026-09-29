const express = require('express');
const { v4: uuid } = require('uuid');
const bcrypt = require('bcryptjs');
const { readCollection, writeCollection, appendAudit } = require('../db');
const { issueToken, authRequired, passwordIssue, safeCompare } = require('../utils/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

/**
 * In-memory OTP store, keyed by mobile number.
 * Real UID/Aadhaar OTP delivery is an external integration (BRD §18) — this
 * mock issues a fixed OTP and prints it to the server console so the flow
 * (Mobile → OTP → KYC → Bank → Profile → Farmer ID, BRD §5) can be exercised
 * end to end before that integration is wired in.
 */
const otpStore = new Map();

router.post('/otp/request', (req, res) => {
  const { mobile } = req.body;
  if (!/^[6-9]\d{9}$/.test(mobile || '')) {
    return res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile number' });
  }
  const otp = '123456'; // fixed mock OTP for local/dev use
  otpStore.set(mobile, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
  console.log(`[MOCK OTP] ${mobile} -> ${otp}`);
  res.json({ sent: true, mobile, devHint: 'Use 123456 in local/dev mode' });
}); 

router.post('/otp/verify', (req, res) => {
  const { mobile, otp } = req.body;
  const rec = otpStore.get(mobile);
  if (!rec || rec.expiresAt < Date.now() || rec.otp !== otp) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }
  otpStore.delete(mobile);
  res.json({ verified: true });
});

/** BRD §5 — Registration flow output: Unique Farmer ID e.g. KU-FMR-2026-00001245 */
function nextFarmerId(existingFarmers) {
  const year = new Date().getFullYear();
  const prefix = `KU-FMR-${year}-`;
  const seq = existingFarmers
    .map(f => f.farmerId)
    .filter(id => id && id.startsWith(prefix))
    .map(id => parseInt(id.slice(prefix.length), 10))
    .reduce((max, n) => Math.max(max, n || 0), 0) + 1;
  return `${prefix}${String(seq).padStart(8, '0')}`;
}

/** Complete registration: personal, KYC, banking, profile, consent (BRD §5) */
router.post('/register', asyncHandler(async (req, res) => {
  const {
    name, dob, mobile, address,
    aadhaarLast4, pan,
    bankAccountNumber, ifsc, accountHolderName,
    village, taluka, district, state,
    preferredCommodities,
    password,
    consentAccepted
  } = req.body;

  const required = { name, dob, mobile, aadhaarLast4, pan, bankAccountNumber, ifsc, accountHolderName, state, password };
  const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  if (!consentAccepted) return res.status(400).json({ error: 'Consent and declaration must be accepted (BRD §5)' });

  const pwIssue = passwordIssue(password);
  if (pwIssue) return res.status(400).json({ error: pwIssue });

  const farmers = await readCollection('farmers');
  if (farmers.some(f => f.mobile === mobile)) {
    return res.status(409).json({ error: 'A farmer is already registered with this mobile number' });
  }

  const farmer = {
    id: uuid(),
    farmerId: nextFarmerId(farmers),
    name, dob, mobile, address,
    kyc: { aadhaarLast4, pan, verifiedAt: new Date().toISOString() },
    bank: { bankAccountNumber, ifsc, accountHolderName },
    location: { village, taluka, district, state },
    preferredCommodities: preferredCommodities || [],
    passwordHash: bcrypt.hashSync(password, 10),
    consentAcceptedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    status: 'ACTIVE'
  };
  farmers.push(farmer);
  await writeCollection('farmers', farmers);
  await appendAudit({ actor: farmer.farmerId, action: 'FARMER_REGISTERED', entity: 'farmer', entityId: farmer.id });

  const { passwordHash, ...safe } = farmer;
  const token = issueToken({ sub: farmer.id, role: 'FARMER', farmerId: farmer.farmerId });
  res.status(201).json({ farmer: safe, token });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { mobile, password } = req.body;
  const farmers = await readCollection('farmers');
  const farmer = farmers.find(f => f.mobile === mobile);
  if (!farmer || !safeCompare(password, farmer.passwordHash)) {
    return res.status(401).json({ error: 'Invalid mobile number or password' });
  }
  const { passwordHash, ...safe } = farmer;
  const token = issueToken({ sub: farmer.id, role: 'FARMER', farmerId: farmer.farmerId });
  res.json({ farmer: safe, token });
}));

router.get('/me', authRequired, asyncHandler(async (req, res) => {
  const farmers = await readCollection('farmers');
  const farmer = farmers.find(f => f.id === req.user.sub);
  if (!farmer) return res.status(404).json({ error: 'Not found' });
  const { passwordHash, ...safe } = farmer;
  res.json(safe);
}));

module.exports = router;
