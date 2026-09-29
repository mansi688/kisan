const express = require('express');
const { v4: uuid } = require('uuid');
const { readCollection, writeCollection, appendAudit } = require('../db');
const { authRequired, requireRole } = require('../utils/auth');
const {
  validateFinanceAmount, computeMaturityDate, computeExposure,
  accrueInterest, computeRiskStatus, maxEligibleFinance
} = require('../utils/calc');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

/** Registered financers submit interest-rate and commercial offers against a WR (BRD §8) */
router.post('/offers', authRequired, requireRole('FINANCER'), asyncHandler(async (req, res) => {
  const { wrId, interestRatePct, processingFee, otherCharges, tenureMonths, conditions } = req.body;

  const receipts = await readCollection('warehouseReceipts');
  const wr = receipts.find(w => w.id === wrId);
  if (!wr) return res.status(404).json({ error: 'WR not found' });
  if (wr.lienStatus !== 'FREE') return res.status(409).json({ error: 'WR already pledged — duplicate financing is not permitted (BRD §19)' });

  // Financer proposes an amount up to the 75% cap; if omitted, default to the cap itself.
  const requestedAmount = req.body.requestedAmount ?? maxEligibleFinance(wr.valuation.wrValue);
  const check = validateFinanceAmount(wr.valuation.wrValue, requestedAmount);
  if (!check.valid) return res.status(400).json({ error: check.message });

  const offers = await readCollection('financingOffers');
  const offer = {
    id: uuid(),
    wrId,
    financerId: req.user.sub,
    amount: requestedAmount,
    interestRatePct, processingFee: processingFee || 0, otherCharges: otherCharges || 0,
    tenureMonths: Math.min(tenureMonths || 9, 9),
    conditions: conditions || '',
    // Effective total financing cost ranks offers by more than nominal rate (BRD §8)
    effectiveCostScore: interestRatePct + ((processingFee || 0) + (otherCharges || 0)) / requestedAmount * 100,
    status: 'SUBMITTED',
    submittedAt: new Date().toISOString()
  };
  offers.push(offer);
  await writeCollection('financingOffers', offers);
  await appendAudit({ actor: req.user.sub, action: 'FINANCE_OFFER_SUBMITTED', entity: 'financingOffer', entityId: offer.id });

  res.status(201).json(offer);
}));

/** Farmer's side-by-side offer comparison, ranked by effective cost (BRD §8).
 *  Also used by the Financer portal with ?financerId= to list its own offers.
 *  Same reasoning as GET /api/wr — genuinely shared read data across roles,
 *  but not something that should be fully public (loan amounts and rates
 *  are commercial terms, not open marketplace listings). */
router.get('/offers', authRequired, asyncHandler(async (req, res) => {
  const { wrId, financerId } = req.query;
  let offers = await readCollection('financingOffers');
  if (wrId) offers = offers.filter(o => o.wrId === wrId);
  if (financerId) offers = offers.filter(o => o.financerId === financerId);
  offers.sort((a, b) => a.effectiveCostScore - b.effectiveCostScore);
  res.json(offers);
}));

/** Farmer confirms the selected offer via OTP/digital consent (BRD §8, §17) */
router.post('/offers/:offerId/select', authRequired, requireRole('FARMER'), asyncHandler(async (req, res) => {
  const { otp } = req.body;
  if (otp !== '123456') return res.status(400).json({ error: 'Invalid OTP consent' }); // mock OTP, see farmers.js

  const offers = await readCollection('financingOffers');
  const offer = offers.find(o => o.id === req.params.offerId);
  if (!offer) return res.status(404).json({ error: 'Offer not found' });

  const receipts = await readCollection('warehouseReceipts');
  const wr = receipts.find(w => w.id === offer.wrId);
  if (!wr || wr.farmerId !== req.user.farmerId) return res.status(403).json({ error: 'Not your WR' });
  if (wr.lienStatus !== 'FREE') return res.status(409).json({ error: 'WR already pledged' });

  offer.status = 'SELECTED';
  offer.selectedAt = new Date().toISOString();
  offers.filter(o => o.wrId === offer.wrId && o.id !== offer.id).forEach(o => { o.status = 'REJECTED'; });
  await writeCollection('financingOffers', offers);

  await appendAudit({ actor: req.user.farmerId, action: 'FINANCE_OFFER_SELECTED', entity: 'financingOffer', entityId: offer.id });
  res.json(offer);
}));

/** Financer credit approval + disbursement; WR is lien-marked, loan becomes active (BRD §9) */
router.post('/offers/:offerId/disburse', authRequired, requireRole('FINANCER'), asyncHandler(async (req, res) => {
  const offers = await readCollection('financingOffers');
  const offer = offers.find(o => o.id === req.params.offerId);
  if (!offer) return res.status(404).json({ error: 'Offer not found' });
  if (offer.status !== 'SELECTED') return res.status(409).json({ error: `Offer must be SELECTED by farmer first (currently ${offer.status})` });
  if (offer.financerId !== req.user.sub) return res.status(403).json({ error: 'Not your offer' });

  const receipts = await readCollection('warehouseReceipts');
  const wr = receipts.find(w => w.id === offer.wrId);
  if (!wr) return res.status(404).json({ error: 'WR not found' });
  if (wr.lienStatus !== 'FREE') return res.status(409).json({ error: 'Duplicate financing blocked — WR already pledged (BRD §19)' });

  const disbursementDate = new Date().toISOString().slice(0, 10);
  const maturityDate = computeMaturityDate(disbursementDate);

  const loans = await readCollection('loans');
  const loan = {
    id: uuid(),
    loanRef: `KU-LN-${Date.now()}`,
    wrId: wr.id,
    farmerId: wr.farmerId,
    financerId: offer.financerId,
    offerId: offer.id,
    principal: offer.amount,
    interestRatePct: offer.interestRatePct,
    processingFee: offer.processingFee,
    otherCharges: offer.otherCharges,
    disbursementDate,
    maturityDate,
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };
  loans.push(loan);
  await writeCollection('loans', loans);

  offer.status = 'DISBURSED';
  await writeCollection('financingOffers', offers);

  wr.lienStatus = 'PLEDGED';
  wr.financerId = offer.financerId;
  wr.status = 'PLEDGED';
  await writeCollection('warehouseReceipts', receipts);

  await appendAudit({ actor: req.user.sub, action: 'LOAN_DISBURSED', entity: 'loan', entityId: loan.id, meta: { principal: loan.principal, maturityDate } });
  res.status(201).json(loan);
}));

router.get('/loans', authRequired, asyncHandler(async (req, res) => {
  const { farmerId, financerId } = req.query;
  let loans = await readCollection('loans');
  if (farmerId) loans = loans.filter(l => l.farmerId === farmerId);
  if (financerId) loans = loans.filter(l => l.financerId === financerId);
  res.json(loans);
}));

/**
 * Daily exposure + risk-status monitoring (BRD §10, §19).
 * Recomputes accrued interest as of "today" (or ?asOf=YYYY-MM-DD) and
 * evaluates the 90% risk ceiling against the WR's ORIGINAL value.
 */
router.get('/loans/:loanId/exposure', authRequired, asyncHandler(async (req, res) => {
  const loans = await readCollection('loans');
  const loan = loans.find(l => l.id === req.params.loanId);
  if (!loan) return res.status(404).json({ error: 'Loan not found' });

  const receipts = await readCollection('warehouseReceipts');
  const wr = receipts.find(w => w.id === loan.wrId);
  const asOf = req.query.asOf || new Date().toISOString().slice(0, 10);
  const storageChargesPerDay = req.query.storagePerDay ? Number(req.query.storagePerDay) : 50; // demo default

  const days = Math.max(0, Math.floor((new Date(asOf) - new Date(loan.disbursementDate)) / 86400000));
  const accruedInterest = accrueInterest({
    principal: loan.principal, annualRatePct: loan.interestRatePct,
    disbursementDateISO: loan.disbursementDate, asOfDateISO: asOf
  });
  const storageCharges = round2(storageChargesPerDay * days);
  const totalExposure = computeExposure({
    principal: loan.principal, accruedInterest, storageCharges, approvedCharges: loan.otherCharges || 0
  });
  const risk = computeRiskStatus(wr.valuation.wrValue, totalExposure);

  const snapshot = {
    id: uuid(),
    loanId: loan.id, asOf,
    principal: loan.principal, accruedInterest, storageCharges,
    totalExposure,
    originalWrValue: wr.valuation.wrValue,
    ...risk,
    maturityDate: loan.maturityDate,
    daysToMaturity: Math.floor((new Date(loan.maturityDate) - new Date(asOf)) / 86400000)
  };

  const snapshots = await readCollection('exposureSnapshots');
  snapshots.push(snapshot);
  await writeCollection('exposureSnapshots', snapshots);

  res.json(snapshot);
}));

function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

module.exports = router;
