const express = require('express');
const { v4: uuid } = require('uuid');
const { readCollection, writeCollection, appendAudit } = require('../db');
const { authRequired, requireRole } = require('../utils/auth');
const { computeSettlementWaterfall, accrueInterest } = require('../utils/calc');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

/**
 * Escrow confirms receipt of cleared funds, then the settlement waterfall
 * runs: principal → interest → storage → approved charges → farmer balance
 * (BRD §13). Lien release and stock release follow automatically once the
 * waterfall clears without a shortfall.
 */
router.post('/:auctionId/settle', authRequired, requireRole('ADMIN', 'FINANCER'), asyncHandler(async (req, res) => {
  const auctions = await readCollection('auctions');
  const auction = auctions.find(a => a.id === req.params.auctionId);
  if (!auction) return res.status(404).json({ error: 'Auction not found' });
  if (auction.status !== 'ACCEPTED') return res.status(409).json({ error: 'Auction must be in ACCEPTED status (farmer accepted H1) before settlement' });

  const bids = await readCollection('bids');
  const h1 = bids.find(b => b.id === auction.h1BidId);
  if (!h1) return res.status(409).json({ error: 'No H1 bid recorded for this auction' });

  const loans = await readCollection('loans');
  const loan = loans.find(l => l.wrId === auction.wrId && l.status === 'ACTIVE');
  if (!loan) return res.status(409).json({ error: 'No active loan found for this WR' });

  const asOf = new Date().toISOString().slice(0, 10);
  const days = Math.max(0, Math.floor((new Date(asOf) - new Date(loan.disbursementDate)) / 86400000));
  const accruedInterest = accrueInterest({ principal: loan.principal, annualRatePct: loan.interestRatePct, disbursementDateISO: loan.disbursementDate, asOfDateISO: asOf });
  const storageCharges = round2(50 * days);

  const waterfall = computeSettlementWaterfall({
    saleProceeds: h1.totalValue,
    principal: loan.principal,
    accruedInterest,
    storageCharges,
    approvedCharges: loan.otherCharges || 0
  });

  const settlements = await readCollection('settlements');
  const settlement = {
    id: uuid(),
    settlementRef: `KU-STL-${Date.now()}`,
    auctionId: auction.id,
    wrId: auction.wrId,
    loanId: loan.id,
    farmerId: auction.farmerId,
    processorId: h1.processorId,
    ...waterfall,
    settledAt: new Date().toISOString(),
    settledBy: req.user.sub
  };
  settlements.push(settlement);
  await writeCollection('settlements', settlements);

  // Close out loan, release lien, close WR, close auction — only on a clean (non-shortfall) settlement.
  if (!waterfall.isShortfall) {
    loan.status = 'CLOSED';
    loan.closedAt = settlement.settledAt;
    await writeCollection('loans', loans);

    const receipts = await readCollection('warehouseReceipts');
    const wr = receipts.find(w => w.id === auction.wrId);
    wr.lienStatus = 'RELEASED';
    wr.status = 'CLOSED';
    await writeCollection('warehouseReceipts', receipts);

    auction.status = 'SETTLED';
    await writeCollection('auctions', auctions);
  } else {
    settlement.status = 'SHORTFALL_HOLD';
    await writeCollection('settlements', settlements);
  }

  await appendAudit({ actor: req.user.sub, action: 'SETTLEMENT_COMPLETED', entity: 'settlement', entityId: settlement.id, meta: { farmerPayable: waterfall.farmerPayable, shortfall: waterfall.isShortfall } });
  res.status(201).json(settlement);
}));

router.get('/', asyncHandler(async (req, res) => {
  const { farmerId } = req.query;
  let settlements = await readCollection('settlements');
  if (farmerId) settlements = settlements.filter(s => s.farmerId === farmerId);
  res.json(settlements);
}));

function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

module.exports = router;
