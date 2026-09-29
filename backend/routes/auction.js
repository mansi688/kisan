const express = require('express');
const { v4: uuid } = require('uuid');
const { readCollection, writeCollection, appendAudit } = require('../db');
const { authRequired, requireRole } = require('../utils/auth');
const { accrueInterest, computeExposure } = require('../utils/calc');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

/** Portal opens an auction lot for eligible pledged stock (BRD §11) */
router.post('/', authRequired, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const { wrId, windowOpensAt, windowClosesAt } = req.body;
  const receipts = await readCollection('warehouseReceipts');
  const wr = receipts.find(w => w.id === wrId);
  if (!wr) return res.status(404).json({ error: 'WR not found' });
  if (wr.lienStatus !== 'PLEDGED') return res.status(409).json({ error: 'Only pledged WRs are eligible for auction' });

  const auctions = await readCollection('auctions');
  const auction = {
    id: uuid(),
    auctionId: `KU-AUC-${Date.now()}`,
    wrId, farmerId: wr.farmerId,
    commodity: wr.commodity, quantityMT: wr.quantityMT, quality: wr.grade,
    warehouseId: wr.warehouseId,
    windowOpensAt, windowClosesAt,
    status: 'OPEN',
    h1BidId: null,
    createdAt: new Date().toISOString()
  };
  auctions.push(auction);
  await writeCollection('auctions', auctions);
  await appendAudit({ actor: req.user.sub, action: 'AUCTION_OPENED', entity: 'auction', entityId: auction.id });
  res.status(201).json(auction);
}));

router.get('/', asyncHandler(async (req, res) => {
  const { status } = req.query;
  let auctions = await readCollection('auctions');
  if (status) auctions = auctions.filter(a => a.status === status);
  res.json(auctions);
}));

/** Registered processor submits a bid within the configured auction window (BRD §11) */
router.post('/:auctionId/bids', authRequired, requireRole('PROCESSOR'), asyncHandler(async (req, res) => {
  const { pricePerMT } = req.body;
  const auctions = await readCollection('auctions');
  const auction = auctions.find(a => a.id === req.params.auctionId);
  if (!auction) return res.status(404).json({ error: 'Auction not found' });
  if (auction.status !== 'OPEN') return res.status(409).json({ error: `Auction is ${auction.status}, not accepting bids` });

  const now = new Date();
  if (auction.windowOpensAt && now < new Date(auction.windowOpensAt)) return res.status(409).json({ error: 'Auction window has not opened yet' });
  if (auction.windowClosesAt && now > new Date(auction.windowClosesAt)) return res.status(409).json({ error: 'Auction window has closed' });

  const bids = await readCollection('bids');
  const bid = {
    id: uuid(),
    auctionId: auction.id,
    processorId: req.user.sub,
    pricePerMT,
    totalValue: round2(pricePerMT * auction.quantityMT),
    submittedAt: new Date().toISOString()
  };
  bids.push(bid);
  await writeCollection('bids', bids);

  // Recompute H1 (highest valid bid) — bid history and timestamps are retained in full (BRD §11)
  const auctionBids = bids.filter(b => b.auctionId === auction.id);
  const h1 = auctionBids.reduce((best, b) => (!best || b.pricePerMT > best.pricePerMT) ? b : best, null);
  auction.h1BidId = h1.id;
  await writeCollection('auctions', auctions);

  await appendAudit({ actor: req.user.sub, action: 'BID_SUBMITTED', entity: 'bid', entityId: bid.id });
  res.status(201).json(bid);
}));

router.get('/:auctionId/bids', asyncHandler(async (req, res) => {
  const bids = (await readCollection('bids')).filter(b => b.auctionId === req.params.auctionId);
  bids.sort((a, b) => b.pricePerMT - a.pricePerMT);
  res.json(bids);
}));

/**
 * Farmer P&L snapshot before decision (BRD §12): H1, current indicative value,
 * outstanding principal, accrued interest, storage charges, estimated net proceeds.
 */
router.get('/:auctionId/farmer-view', asyncHandler(async (req, res) => {
  const auction = (await readCollection('auctions')).find(a => a.id === req.params.auctionId);
  if (!auction) return res.status(404).json({ error: 'Auction not found' });
  const bids = (await readCollection('bids')).filter(b => b.auctionId === auction.id);
  const h1 = bids.find(b => b.id === auction.h1BidId) || null;

  const loans = (await readCollection('loans')).filter(l => l.wrId === auction.wrId && l.status === 'ACTIVE');
  const loan = loans[0] || null;

  let exposure = null;
  let breakdown = null;
  if (loan) {
    const asOf = new Date().toISOString().slice(0, 10);
    const days = Math.max(0, Math.floor((new Date(asOf) - new Date(loan.disbursementDate)) / 86400000));
    const accruedInterest = accrueInterest({ principal: loan.principal, annualRatePct: loan.interestRatePct, disbursementDateISO: loan.disbursementDate, asOfDateISO: asOf });
    const storageCharges = round2(50 * days);
    exposure = computeExposure({ principal: loan.principal, accruedInterest, storageCharges, approvedCharges: loan.otherCharges || 0 });
    breakdown = { principal: loan.principal, accruedInterest, storageCharges, approvedCharges: loan.otherCharges || 0 };
  }

  const estimatedNetProceeds = h1 && exposure != null ? round2(h1.totalValue - exposure) : null;

  res.json({ auction, h1, breakdown, totalExposure: exposure, estimatedNetProceeds });
}));

/** Farmer decision: NEGOTIATE / ACCEPT H1 / WAIT & WATCH (BRD §12) */
router.post('/:auctionId/decision', authRequired, requireRole('FARMER'), asyncHandler(async (req, res) => {
  const { decision } = req.body; // 'NEGOTIATE' | 'ACCEPT_H1' | 'WAIT_AND_WATCH'
  const validDecisions = ['NEGOTIATE', 'ACCEPT_H1', 'WAIT_AND_WATCH'];
  if (!validDecisions.includes(decision)) return res.status(400).json({ error: `decision must be one of ${validDecisions.join(', ')}` });

  const auctions = await readCollection('auctions');
  const auction = auctions.find(a => a.id === req.params.auctionId);
  if (!auction) return res.status(404).json({ error: 'Auction not found' });
  if (auction.farmerId !== req.user.farmerId) return res.status(403).json({ error: 'Not your auction lot' });

  const decisions = await readCollection('decisions');
  const record = { id: uuid(), auctionId: auction.id, farmerId: req.user.farmerId, decision, decidedAt: new Date().toISOString() };
  decisions.push(record);
  await writeCollection('decisions', decisions);

  if (decision === 'ACCEPT_H1') {
    auction.status = 'ACCEPTED';
  } else if (decision === 'NEGOTIATE') {
    auction.status = 'NEGOTIATING';
  } else {
    auction.status = 'OPEN'; // stays in the pool, continues accruing interest/storage, re-enters next eligible auction window
  }
  await writeCollection('auctions', auctions);
  await appendAudit({ actor: req.user.farmerId, action: `FARMER_DECISION_${decision}`, entity: 'auction', entityId: auction.id });

  res.status(201).json(record);
}));

function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

module.exports = router;
