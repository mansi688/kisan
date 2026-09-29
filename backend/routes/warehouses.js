const express = require('express');
const { v4: uuid } = require('uuid');
const { readCollection, writeCollection, appendAudit } = require('../db');
const { authRequired, requireRole } = require('../utils/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

/** BRD §6 — Warehouse search by commodity, location and available capacity */
router.get('/', asyncHandler(async (req, res) => {
  const { commodity, district } = req.query;
  let warehouses = await readCollection('warehouses');
  if (commodity) warehouses = warehouses.filter(w => w.commodities.includes(commodity));
  if (district) warehouses = warehouses.filter(w => w.district.toLowerCase() === String(district).toLowerCase());
  res.json(warehouses);
}));

router.post('/', authRequired, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const warehouses = await readCollection('warehouses');
  const w = {
    id: uuid(),
    name: req.body.name,
    wspCmName: req.body.wspCmName,
    district: req.body.district,
    state: req.body.state,
    commodities: req.body.commodities || [],
    capacityMT: req.body.capacityMT,
    availableCapacityMT: req.body.capacityMT,
    chargesPerMTPerDay: req.body.chargesPerMTPerDay,
    insuranceValidTill: req.body.insuranceValidTill,
    agreementApproved: true,
    createdAt: new Date().toISOString()
  };
  warehouses.push(w);
  await writeCollection('warehouses', warehouses);
  res.status(201).json(w);
}));

/** Farmer books space; capacity is decremented server-side (BRD §6) */
router.post('/:warehouseId/book', authRequired, requireRole('FARMER'), asyncHandler(async (req, res) => {
  const { commodity, estimatedQuantityMT } = req.body;
  const warehouses = await readCollection('warehouses');
  const warehouse = warehouses.find(w => w.id === req.params.warehouseId);
  if (!warehouse) return res.status(404).json({ error: 'Warehouse not found' });
  if (!warehouse.agreementApproved) return res.status(409).json({ error: 'Warehouse agreement not approved — booking blocked' });
  if (estimatedQuantityMT > warehouse.availableCapacityMT) {
    return res.status(409).json({ error: 'Insufficient warehouse capacity available' });
  }

  const bookings = await readCollection('bookings');
  const booking = {
    id: uuid(),
    bookingRef: `KU-BK-${Date.now()}`,
    farmerId: req.user.farmerId,
    warehouseId: warehouse.id,
    commodity,
    estimatedQuantityMT,
    status: 'CONFIRMED',
    createdAt: new Date().toISOString()
  };
  bookings.push(booking);
  await writeCollection('bookings', bookings);

  warehouse.availableCapacityMT -= estimatedQuantityMT;
  await writeCollection('warehouses', warehouses);
  await appendAudit({ actor: req.user.farmerId, action: 'WAREHOUSE_BOOKED', entity: 'booking', entityId: booking.id });

  res.status(201).json(booking);
}));

router.get('/bookings/mine', authRequired, requireRole('FARMER'), asyncHandler(async (req, res) => {
  const bookings = (await readCollection('bookings')).filter(b => b.farmerId === req.user.farmerId);
  res.json(bookings);
}));

/** WSP/CM portal — bookings against one of its warehouses, so intake can be recorded against them */
router.get('/:warehouseId/bookings', authRequired, requireRole('WSP_CM', 'WSP_CM_MANAGER', 'ADMIN'), asyncHandler(async (req, res) => {
  const bookings = (await readCollection('bookings')).filter(b => b.warehouseId === req.params.warehouseId);
  res.json(bookings);
}));

/** WSP/CM portal — stock intake queue, optionally scoped to a warehouse and/or status
 *  (e.g. ?status=PENDING_MAKER_CHECKER for the approvals screen) */
router.get('/stock-intake', authRequired, requireRole('WSP_CM', 'WSP_CM_MANAGER', 'ADMIN'), asyncHandler(async (req, res) => {
  const { warehouseId, status } = req.query;
  let intakes = await readCollection('stockIntakes');
  if (warehouseId) intakes = intakes.filter(i => i.warehouseId === warehouseId);
  if (status) intakes = intakes.filter(i => i.status === status);
  res.json(intakes);
}));

/**
 * WSP/CM records physical arrival: bags, gross/tare/net weight and quality
 * parameters (BRD §6). Net-of-tare, quality-adjusted eligible quantity is
 * computed here; a maker-checker flag is set for any discrepancy or quality
 * exception rather than auto-approving it (BRD §6, §17).
 */
router.post('/:warehouseId/stock-intake', authRequired, requireRole('WSP_CM'), asyncHandler(async (req, res) => {
  const {
    bookingId, bags, grossWeightKg, tareWeightKg,
    qualityParams, moistureRejectPct, foreignMatterRejectPct
  } = req.body;

  const netWeightKg = grossWeightKg - tareWeightKg;
  const totalRejectPct = (moistureRejectPct || 0) + (foreignMatterRejectPct || 0);
  const eligibleQuantityKg = netWeightKg * (1 - totalRejectPct / 100);

  const needsReview = totalRejectPct > 5 || netWeightKg <= 0; // configurable exception threshold

  const intakes = await readCollection('stockIntakes');
  const intake = {
    id: uuid(),
    intakeRef: `KU-SI-${Date.now()}`,
    bookingId,
    warehouseId: req.params.warehouseId,
    bags, grossWeightKg, tareWeightKg, netWeightKg: round(netWeightKg),
    qualityParams: qualityParams || {},
    totalRejectPct: round(totalRejectPct),
    eligibleQuantityKg: round(eligibleQuantityKg),
    eligibleQuantityMT: round(eligibleQuantityKg / 1000),
    status: needsReview ? 'PENDING_MAKER_CHECKER' : 'VERIFIED',
    recordedAt: new Date().toISOString()
  };
  intakes.push(intake);
  await writeCollection('stockIntakes', intakes);
  await appendAudit({ actor: req.user.sub, action: 'STOCK_INTAKE_RECORDED', entity: 'stockIntake', entityId: intake.id, meta: { status: intake.status } });

  res.status(201).json(intake);
}));

/** Maker-checker approval for a flagged intake (BRD §17) */
router.post('/stock-intake/:intakeId/approve', authRequired, requireRole('WSP_CM_MANAGER', 'ADMIN'), asyncHandler(async (req, res) => {
  const intakes = await readCollection('stockIntakes');
  const intake = intakes.find(i => i.id === req.params.intakeId);
  if (!intake) return res.status(404).json({ error: 'Not found' });
  intake.status = 'VERIFIED';
  intake.approvedBy = req.user.sub;
  intake.approvedAt = new Date().toISOString();
  await writeCollection('stockIntakes', intakes);
  await appendAudit({ actor: req.user.sub, action: 'STOCK_INTAKE_APPROVED', entity: 'stockIntake', entityId: intake.id });
  res.json(intake);
}));

function round(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

module.exports = router;
