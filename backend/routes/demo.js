const express = require('express');
const { readCollection, appendAudit } = require('../db');
const { issueToken } = require('../utils/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

/**
 * Demo Mode (master-prompt §13): real OTP is skipped by design at this
 * phase. This is NOT a bypass bolted onto normal auth — it looks up one of
 * the actual seeded demo accounts and issues the exact same JWT
 * issueToken() produces for a real login, so every downstream authRequired/
 * requireRole check behaves identically afterward. What's different is
 * only how the token gets minted: no password, no OTP, just a role choice.
 *
 * Gated by DEMO_MODE so it can be switched off with one env var before any
 * real deployment — disabled, this whole router 404s as if it doesn't
 * exist, rather than responding "disabled" (no point advertising an
 * attack surface that isn't there).
 */
function demoModeEnabled() {
  return (process.env.DEMO_MODE || 'true').toLowerCase() !== 'false';
}

router.use((req, res, next) => {
  if (!demoModeEnabled()) return res.status(404).json({ error: 'Not found' });
  next();
});

const DEMO_ACCOUNTS = {
  FARMER: { collection: 'farmers', match: (f) => f.mobile === '9000000001' },
  FINANCER: { collection: 'financers', match: (p) => p.email === 'financer@demo.kisanunnatti.in' },
  WSP_CM: { collection: 'admins', match: (p) => p.email === 'wsp@demo.kisanunnatti.in' }
  // ADMIN is deliberately NOT here. Admin is locked to exactly one seeded
  // credential (see participants.js — self-registration is blocked too);
  // a no-password Demo Mode entry into the Admin portal would defeat that
  // on its own, regardless of which account it pointed at.
};

router.get('/status', (req, res) => res.json({ enabled: true, roles: Object.keys(DEMO_ACCOUNTS) }));

router.post('/login', asyncHandler(async (req, res) => {
  const { role } = req.body;
  const config = DEMO_ACCOUNTS[role];
  if (!config) return res.status(400).json({ error: `Unknown demo role: ${role}` });

  const list = await readCollection(config.collection);
  const account = list.find(config.match);
  if (!account) return res.status(404).json({ error: 'Demo account not seeded yet — run `npm run seed`.' });

  await appendAudit({ actor: `demo:${role}`, action: 'DEMO_LOGIN', entity: config.collection, entityId: account.id });

  const { passwordHash, ...safe } = account;
  if (role === 'FARMER') {
    const token = issueToken({ sub: account.id, role: 'FARMER', farmerId: account.farmerId });
    return res.json({ farmer: safe, token, demo: true });
  }
  const token = issueToken({ sub: account.id, role });
  res.json({ participant: safe, token, demo: true });
}));

module.exports = router;
