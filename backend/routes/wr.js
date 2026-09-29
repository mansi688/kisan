const express = require('express');
const { v4: uuid } = require('uuid');
const { readCollection, writeCollection, appendAudit } = require('../db');
const { authRequired, requireRole } = require('../utils/auth');
const { computeWrValue } = require('../utils/calc');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

function nextWrNumber(existing) {
  const year = new Date().getFullYear();
  const prefix = `KU-WR-${year}-`;
  const seq = existing
    .map(w => w.wrNumber)
    .filter(n => n && n.startsWith(prefix))
    .map(n => parseInt(n.slice(prefix.length), 10))
    .reduce((max, n) => Math.max(max, n || 0), 0) + 1;
  return `${prefix}${String(seq).padStart(6, '0')}`;
}

/**
 * WSP/CM submits the verified WR (BRD §7).
 * Market-rate hierarchy (APMC → reference → fallback) is passed in by the
 * caller with a `rateSource` label so the valuation retains source, date,
 * time and the full approval trail as the BRD requires.
 */
router.post('/', authRequired, requireRole('WSP_CM', 'WSP_CM_MANAGER'), asyncHandler(async (req, res) => {
  const {
    stockIntakeId, farmerId, warehouseId, commodity, grade,
    marketRatePerMT, rateSource, insuranceRef
  } = req.body;

  const intakes = await readCollection('stockIntakes');
  const intake = intakes.find(i => i.id === stockIntakeId);
  if (!intake) return res.status(404).json({ error: 'Stock intake record not found' });
  if (intake.status !== 'VERIFIED') {
    return res.status(409).json({ error: `Stock intake is ${intake.status} — cannot issue WR until verified (maker-checker)` });
  }

  const wrValue = computeWrValue(intake.eligibleQuantityMT, marketRatePerMT);
  const receipts = await readCollection('warehouseReceipts');
  const wr = {
    id: uuid(),
    wrNumber: nextWrNumber(receipts),
    farmerId, warehouseId, stockIntakeId,
    commodity, grade,
    quantityMT: intake.eligibleQuantityMT,
    valuation: {
      marketRatePerMT, rateSource,
      wrValue,
      valuedAt: new Date().toISOString(),
      valuedBy: req.user.sub
    },
    insuranceRef: insuranceRef || null,
    lienStatus: 'FREE',
    financerId: null,
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };
  receipts.push(wr);
  await writeCollection('warehouseReceipts', receipts);
  await appendAudit({ actor: req.user.sub, action: 'WR_ISSUED', entity: 'warehouseReceipt', entityId: wr.id, meta: { wrValue } });

  res.status(201).json(wr);
}));

/**
 * Read access requires ANY authenticated role (not a specific one) — this
 * genuinely is shared read data: farmers see their own WRs, financers browse
 * the marketplace for unpledged ones, WSP/CM operators cross-reference
 * already-issued WRs, admins oversee all of it. What it must not be is
 * fully public — a WR carries a farmer's identity, exact holdings and their
 * computed valuation, which isn't public marketplace data the way an open
 * auction listing is.
 */
router.get('/', authRequired, asyncHandler(async (req, res) => {
  const { farmerId, status } = req.query;
  let receipts = await readCollection('warehouseReceipts');
  if (farmerId) receipts = receipts.filter(w => w.farmerId === farmerId);
  if (status) receipts = receipts.filter(w => w.status === status);
  res.json(receipts);
}));

router.get('/:wrId', authRequired, asyncHandler(async (req, res) => {
  const wr = (await readCollection('warehouseReceipts')).find(w => w.id === req.params.wrId);
  if (!wr) return res.status(404).json({ error: 'Not found' });
  res.json(wr);
}));

module.exports = router;
