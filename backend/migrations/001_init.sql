-- 001_init.sql
-- KisanUnnatti Postgres schema — Phase 2.
--
-- Design notes:
-- * One table per existing JSON collection (backend/data/*.json), same
--   field names, so routes that build/read plain JS objects don't need to
--   change shape — only the read/write mechanics underneath them change
--   (see ../db.postgres.js).
-- * Column names are double-quoted camelCase to match the JS objects
--   exactly (e.g. "farmerId", not farmer_id) — this keeps the adapter a
--   thin pass-through instead of a name-mapping layer.
-- * Nested/variable-shape data (kyc, bank, location, valuation, steps,
--   meta, qualityParams) stays JSONB rather than being fully normalized —
--   these are read/written as whole objects everywhere they're used today,
--   so normalizing them now would be churn without benefit. Fields that
--   routes actually filter or join on (farmerId, financerId, status, wrId,
--   etc.) are real typed columns with indexes.
-- * Money/quantity fields stay DOUBLE PRECISION to match existing JS
--   number semantics exactly (utils/calc.js was tested against float
--   arithmetic) rather than switching to NUMERIC and risking rounding
--   differences from the tested business rules.

CREATE TABLE IF NOT EXISTS farmers (
  id                TEXT PRIMARY KEY,
  "farmerId"        TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  dob               TEXT,
  mobile            TEXT UNIQUE NOT NULL,
  address           TEXT,
  kyc               JSONB,
  bank              JSONB,
  location          JSONB,
  "preferredCommodities" TEXT[] DEFAULT '{}',
  "passwordHash"    TEXT NOT NULL,
  "consentAcceptedAt" TIMESTAMPTZ,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  status            TEXT NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS warehouses (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  "wspCmName"       TEXT,
  district          TEXT,
  state             TEXT,
  commodities       TEXT[] DEFAULT '{}',
  "capacityMT"      DOUBLE PRECISION NOT NULL,
  "availableCapacityMT" DOUBLE PRECISION NOT NULL,
  "chargesPerMTPerDay" DOUBLE PRECISION,
  "insuranceValidTill" TEXT,
  "agreementApproved" BOOLEAN NOT NULL DEFAULT false,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_warehouses_district ON warehouses (district);

CREATE TABLE IF NOT EXISTS bookings (
  id                TEXT PRIMARY KEY,
  "bookingRef"      TEXT UNIQUE NOT NULL,
  "farmerId"        TEXT NOT NULL,
  "warehouseId"     TEXT NOT NULL REFERENCES warehouses(id),
  commodity         TEXT,
  "estimatedQuantityMT" DOUBLE PRECISION,
  status            TEXT NOT NULL DEFAULT 'CONFIRMED',
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bookings_farmerId ON bookings ("farmerId");
CREATE INDEX IF NOT EXISTS idx_bookings_warehouseId ON bookings ("warehouseId");

CREATE TABLE IF NOT EXISTS "stockIntakes" (
  id                TEXT PRIMARY KEY,
  "intakeRef"       TEXT UNIQUE NOT NULL,
  "bookingId"       TEXT REFERENCES bookings(id),
  "warehouseId"     TEXT NOT NULL REFERENCES warehouses(id),
  bags              INTEGER,
  "grossWeightKg"   DOUBLE PRECISION,
  "tareWeightKg"    DOUBLE PRECISION,
  "netWeightKg"     DOUBLE PRECISION,
  "qualityParams"   JSONB,
  "totalRejectPct"  DOUBLE PRECISION,
  "eligibleQuantityKg" DOUBLE PRECISION,
  "eligibleQuantityMT" DOUBLE PRECISION,
  status            TEXT NOT NULL,
  "recordedAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "approvedBy"      TEXT,
  "approvedAt"      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_stockIntakes_warehouseId ON "stockIntakes" ("warehouseId");
CREATE INDEX IF NOT EXISTS idx_stockIntakes_status ON "stockIntakes" (status);

CREATE TABLE IF NOT EXISTS "warehouseReceipts" (
  id                TEXT PRIMARY KEY,
  "wrNumber"        TEXT UNIQUE NOT NULL,
  "farmerId"        TEXT NOT NULL,
  "warehouseId"     TEXT NOT NULL REFERENCES warehouses(id),
  "stockIntakeId"   TEXT REFERENCES "stockIntakes"(id),
  commodity         TEXT,
  grade             TEXT,
  "quantityMT"      DOUBLE PRECISION,
  valuation         JSONB,
  "insuranceRef"    TEXT,
  "lienStatus"      TEXT NOT NULL DEFAULT 'FREE',
  "financerId"      TEXT,
  status            TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wr_farmerId ON "warehouseReceipts" ("farmerId");
CREATE INDEX IF NOT EXISTS idx_wr_status ON "warehouseReceipts" (status);
CREATE INDEX IF NOT EXISTS idx_wr_warehouseId ON "warehouseReceipts" ("warehouseId");

CREATE TABLE IF NOT EXISTS "financingOffers" (
  id                TEXT PRIMARY KEY,
  "wrId"            TEXT NOT NULL REFERENCES "warehouseReceipts"(id),
  "financerId"      TEXT NOT NULL,
  amount            DOUBLE PRECISION NOT NULL,
  "interestRatePct" DOUBLE PRECISION,
  "processingFee"   DOUBLE PRECISION DEFAULT 0,
  "otherCharges"    DOUBLE PRECISION DEFAULT 0,
  "tenureMonths"    INTEGER,
  conditions        TEXT,
  "effectiveCostScore" DOUBLE PRECISION,
  status            TEXT NOT NULL DEFAULT 'SUBMITTED',
  "submittedAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "selectedAt"      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_offers_wrId ON "financingOffers" ("wrId");
CREATE INDEX IF NOT EXISTS idx_offers_financerId ON "financingOffers" ("financerId");

CREATE TABLE IF NOT EXISTS loans (
  id                TEXT PRIMARY KEY,
  "loanRef"         TEXT UNIQUE NOT NULL,
  "wrId"            TEXT NOT NULL REFERENCES "warehouseReceipts"(id),
  "farmerId"        TEXT NOT NULL,
  "financerId"      TEXT NOT NULL,
  "offerId"         TEXT REFERENCES "financingOffers"(id),
  principal         DOUBLE PRECISION NOT NULL,
  "interestRatePct" DOUBLE PRECISION,
  "processingFee"   DOUBLE PRECISION DEFAULT 0,
  "otherCharges"    DOUBLE PRECISION DEFAULT 0,
  "disbursementDate" TEXT,
  "maturityDate"    TEXT,
  status            TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "closedAt"        TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_loans_farmerId ON loans ("farmerId");
CREATE INDEX IF NOT EXISTS idx_loans_financerId ON loans ("financerId");
CREATE INDEX IF NOT EXISTS idx_loans_wrId ON loans ("wrId");
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans (status);

CREATE TABLE IF NOT EXISTS "exposureSnapshots" (
  id                TEXT PRIMARY KEY,
  "loanId"          TEXT NOT NULL REFERENCES loans(id),
  "asOf"            TEXT,
  principal         DOUBLE PRECISION,
  "accruedInterest" DOUBLE PRECISION,
  "storageCharges"  DOUBLE PRECISION,
  "totalExposure"   DOUBLE PRECISION,
  "originalWrValue" DOUBLE PRECISION,
  ceiling           DOUBLE PRECISION,
  "utilisationPct"  DOUBLE PRECISION,
  status            TEXT,
  "maturityDate"    TEXT,
  "daysToMaturity"  INTEGER
);
CREATE INDEX IF NOT EXISTS idx_exposure_loanId ON "exposureSnapshots" ("loanId");

CREATE TABLE IF NOT EXISTS auctions (
  id                TEXT PRIMARY KEY,
  "auctionId"       TEXT UNIQUE NOT NULL,
  "wrId"            TEXT NOT NULL REFERENCES "warehouseReceipts"(id),
  "farmerId"        TEXT NOT NULL,
  commodity         TEXT,
  "quantityMT"      DOUBLE PRECISION,
  quality           TEXT,
  "warehouseId"     TEXT REFERENCES warehouses(id),
  "windowOpensAt"   TEXT,
  "windowClosesAt"  TEXT,
  status            TEXT NOT NULL DEFAULT 'OPEN',
  "h1BidId"         TEXT,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions (status);
CREATE INDEX IF NOT EXISTS idx_auctions_farmerId ON auctions ("farmerId");

CREATE TABLE IF NOT EXISTS bids (
  id                TEXT PRIMARY KEY,
  "auctionId"       TEXT NOT NULL REFERENCES auctions(id),
  "processorId"     TEXT NOT NULL,
  "pricePerMT"      DOUBLE PRECISION NOT NULL,
  "totalValue"      DOUBLE PRECISION NOT NULL,
  "submittedAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bids_auctionId ON bids ("auctionId");

CREATE TABLE IF NOT EXISTS decisions (
  id                TEXT PRIMARY KEY,
  "auctionId"       TEXT NOT NULL REFERENCES auctions(id),
  "farmerId"        TEXT NOT NULL,
  decision          TEXT NOT NULL,
  "decidedAt"       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_decisions_auctionId ON decisions ("auctionId");

CREATE TABLE IF NOT EXISTS settlements (
  id                TEXT PRIMARY KEY,
  "settlementRef"   TEXT UNIQUE NOT NULL,
  "auctionId"       TEXT NOT NULL REFERENCES auctions(id),
  "wrId"            TEXT NOT NULL REFERENCES "warehouseReceipts"(id),
  "loanId"          TEXT NOT NULL REFERENCES loans(id),
  "farmerId"        TEXT NOT NULL,
  "processorId"     TEXT,
  "farmerPayable"   DOUBLE PRECISION,
  steps             JSONB,
  "isShortfall"     BOOLEAN DEFAULT false,
  status            TEXT,
  "settledAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "settledBy"       TEXT
);
CREATE INDEX IF NOT EXISTS idx_settlements_farmerId ON settlements ("farmerId");

CREATE TABLE IF NOT EXISTS processors (
  id                TEXT PRIMARY KEY,
  role              TEXT NOT NULL DEFAULT 'PROCESSOR',
  name              TEXT NOT NULL,
  email             TEXT NOT NULL,
  "orgName"         TEXT,
  "passwordHash"    TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email, role)
);

CREATE TABLE IF NOT EXISTS financers (
  id                TEXT PRIMARY KEY,
  role              TEXT NOT NULL DEFAULT 'FINANCER',
  name              TEXT NOT NULL,
  email             TEXT NOT NULL,
  "orgName"         TEXT,
  "passwordHash"    TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email, role)
);

-- Shared by ADMIN, WSP_CM and WSP_CM_MANAGER operator accounts, exactly as
-- the JSON-era ROLE_TO_COLLECTION mapping in routes/participants.js already does.
CREATE TABLE IF NOT EXISTS admins (
  id                TEXT PRIMARY KEY,
  role              TEXT NOT NULL,
  name              TEXT NOT NULL,
  email             TEXT NOT NULL,
  "orgName"         TEXT,
  "passwordHash"    TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email, role)
);

CREATE TABLE IF NOT EXISTS notifications (
  id                TEXT PRIMARY KEY,
  "recipientId"     TEXT,
  type              TEXT,
  payload           JSONB,
  read              BOOLEAN NOT NULL DEFAULT false,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "auditLog" (
  id                TEXT PRIMARY KEY,
  timestamp         TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor             TEXT,
  action            TEXT,
  entity            TEXT,
  "entityId"        TEXT,
  meta              JSONB
);
CREATE INDEX IF NOT EXISTS idx_auditLog_timestamp ON "auditLog" (timestamp);
