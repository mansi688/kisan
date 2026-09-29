const express = require('express');
const { readCollection } = require('../db');
const { authRequired, requireRole } = require('../utils/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

/** BRD §14.1 — single call that assembles everything the farmer dashboard needs */
router.get('/farmer', authRequired, requireRole('FARMER'), asyncHandler(async (req, res) => {
  const farmerId = req.user.farmerId;
  const [bookingsAll, receiptsAll, offersAll, loansAll, auctionsAll, settlementsAll] = await Promise.all([
    readCollection('bookings'), readCollection('warehouseReceipts'), readCollection('financingOffers'),
    readCollection('loans'), readCollection('auctions'), readCollection('settlements')
  ]);
  const bookings = bookingsAll.filter(b => b.farmerId === farmerId);
  const receipts = receiptsAll.filter(w => w.farmerId === farmerId);
  const offers = offersAll.filter(o => receipts.some(w => w.id === o.wrId));
  const loans = loansAll.filter(l => l.farmerId === farmerId);
  const auctions = auctionsAll.filter(a => a.farmerId === farmerId);
  const settlements = settlementsAll.filter(s => s.farmerId === farmerId);

  res.json({ farmerId, bookings, warehouseReceipts: receipts, financingOffers: offers, loans, auctions, settlements });
}));

/** BRD §15 — Portfolio-level MIS for Admin */
router.get('/portfolio', authRequired, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const [farmers, receipts, loans, auctions, settlements] = await Promise.all([
    readCollection('farmers'), readCollection('warehouseReceipts'), readCollection('loans'),
    readCollection('auctions'), readCollection('settlements')
  ]);
  const activeLoans = loans.filter(l => l.status === 'ACTIVE');
  const totalOutstanding = activeLoans.reduce((sum, l) => sum + l.principal, 0);
  const totalWrValue = receipts.reduce((sum, w) => sum + (w.valuation?.wrValue || 0), 0);
  const avgRate = activeLoans.length ? activeLoans.reduce((s, l) => s + l.interestRatePct, 0) / activeLoans.length : 0;

  res.json({
    farmerCount: farmers.length,
    wrCount: receipts.length,
    totalWrValue: round2(totalWrValue),
    activeLoanCount: activeLoans.length,
    totalOutstanding: round2(totalOutstanding),
    averageInterestRatePct: round2(avgRate),
    auctionCount: auctions.length,
    settlementCount: settlements.length
  });
}));

/** BRD §17 — Audit trail viewer for Admin (read-only; entries are never edited or removed here) */
router.get('/audit-log', authRequired, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 200;
  const log = (await readCollection('auditLog')).slice().reverse().slice(0, limit);
  res.json(log);
}));

function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

module.exports = router;
