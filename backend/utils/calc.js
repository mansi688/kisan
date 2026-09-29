/**
 * calc.js
 * -------
 * Every formula in this file maps directly to a numbered BRD section.
 * Keeping them in one place (rather than inline in route handlers) is what
 * makes "all financial logic must be server-enforced" auditable — a reviewer
 * can check this file against the BRD line by line.
 */

const FINANCE_CAP_PCT = 0.75;      // BRD §8 / §19 — Max 75% of WR Value
const RISK_CEILING_PCT = 0.90;     // BRD §10 / §19 — 90% of original WR value
const MAX_TENURE_MONTHS = 9;       // BRD §9 / §19

/** BRD §7 — WR Value = Net Eligible Quantity × Approved Market Rate */
function computeWrValue(netEligibleQuantity, approvedMarketRate) {
  if (netEligibleQuantity < 0 || approvedMarketRate < 0) {
    throw new Error('Quantity and rate must be non-negative');
  }
  return round2(netEligibleQuantity * approvedMarketRate);
}

/** BRD §8 / §19 — Initial finance cannot exceed 75% of WR value */
function maxEligibleFinance(wrValue) {
  return round2(wrValue * FINANCE_CAP_PCT);
}

function validateFinanceAmount(wrValue, requestedAmount) {
  const cap = maxEligibleFinance(wrValue);
  if (requestedAmount > cap + 0.01) {
    return { valid: false, cap, message: `Finance amount ₹${requestedAmount} exceeds the 75% cap of ₹${cap} for this WR (WR value ₹${wrValue}).` };
  }
  return { valid: true, cap };
}

/**
 * BRD §9 / §19 — Maturity date = earlier of
 *  (a) 9 months from disbursement date, or
 *  (b) 31 August of the forthcoming year
 */
function computeMaturityDate(disbursementDateISO) {
  const disb = new Date(disbursementDateISO);
  if (isNaN(disb.getTime())) throw new Error('Invalid disbursement date');

  const nineMonthsOut = new Date(disb);
  nineMonthsOut.setMonth(nineMonthsOut.getMonth() + MAX_TENURE_MONTHS);

  // "Forthcoming year" = the next 31 August strictly after the disbursement date.
  const augThisYear = new Date(Date.UTC(disb.getUTCFullYear(), 7, 31)); // month 7 = August
  const augBoundary = disb <= augThisYear
    ? augThisYear
    : new Date(Date.UTC(disb.getUTCFullYear() + 1, 7, 31));

  const maturity = nineMonthsOut < augBoundary ? nineMonthsOut : augBoundary;
  return maturity.toISOString().slice(0, 10);
}

/** BRD §10 — Total Exposure = Principal + Accrued Interest + Storage Charges + Approved Charges */
function computeExposure({ principal, accruedInterest, storageCharges, approvedCharges = 0 }) {
  return round2(principal + accruedInterest + storageCharges + approvedCharges);
}

/**
 * Simple daily accrual: annualRatePct applied on outstanding principal,
 * from disbursement date to asOfDate. A production system would use the
 * financer's exact day-count convention; this is a transparent default
 * documented here so it can be swapped per financer policy.
 */
function accrueInterest({ principal, annualRatePct, disbursementDateISO, asOfDateISO }) {
  const start = new Date(disbursementDateISO);
  const asOf = new Date(asOfDateISO);
  const days = Math.max(0, Math.floor((asOf - start) / (1000 * 60 * 60 * 24)));
  const dailyRate = (annualRatePct / 100) / 365;
  return round2(principal * dailyRate * days);
}

/** BRD §10 / §19 — Risk Ceiling = 90% × Original WR Value; returns Green/Amber/Red */
function computeRiskStatus(originalWrValue, totalExposure) {
  const ceiling = round2(originalWrValue * RISK_CEILING_PCT);
  const utilisationPct = ceiling > 0 ? round2((totalExposure / ceiling) * 100) : 0;
  let status = 'GREEN';
  if (totalExposure >= ceiling) status = 'RED';
  else if (totalExposure >= ceiling * (80 / 90)) status = 'AMBER'; // early-warning band before the hard ceiling
  return { ceiling, utilisationPct, status };
}

/**
 * BRD §13 — Settlement waterfall.
 * Farmer Payable = Sale Proceeds − Principal − Accrued Interest − Storage Charges − Approved Charges
 * Order matters and is preserved in the returned breakdown for the settlement statement.
 */
function computeSettlementWaterfall({ saleProceeds, principal, accruedInterest, storageCharges, approvedCharges = 0 }) {
  const steps = [];
  let remaining = saleProceeds;
  steps.push({ step: 'Sale proceeds received into escrow', amount: round2(saleProceeds), remaining: round2(remaining) });

  remaining -= principal;
  steps.push({ step: 'Principal recovered by financer', amount: -round2(principal), remaining: round2(remaining) });

  remaining -= accruedInterest;
  steps.push({ step: 'Accrued interest recovered', amount: -round2(accruedInterest), remaining: round2(remaining) });

  remaining -= storageCharges;
  steps.push({ step: 'Storage charges recovered', amount: -round2(storageCharges), remaining: round2(remaining) });

  remaining -= approvedCharges;
  steps.push({ step: 'Other approved charges recovered', amount: -round2(approvedCharges), remaining: round2(remaining) });

  return {
    farmerPayable: round2(remaining),
    steps,
    isShortfall: remaining < 0
  };
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

module.exports = {
  FINANCE_CAP_PCT, RISK_CEILING_PCT, MAX_TENURE_MONTHS,
  computeWrValue, maxEligibleFinance, validateFinanceAmount,
  computeMaturityDate, computeExposure, accrueInterest,
  computeRiskStatus, computeSettlementWaterfall, round2
};
