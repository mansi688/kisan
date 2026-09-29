-- 002_contact_messages.sql
-- Backs the public website's Contact page (routes/contact.js).

CREATE TABLE IF NOT EXISTS "contactMessages" (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  email             TEXT NOT NULL,
  subject           TEXT,
  message           TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'NEW',
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contactMessages_status ON "contactMessages" (status);
