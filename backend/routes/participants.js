const express = require('express');
const { v4: uuid } = require('uuid');
const bcrypt = require('bcryptjs');
const { readCollection, writeCollection } = require('../db');
const { issueToken, passwordIssue, safeCompare } = require('../utils/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

const ROLE_TO_COLLECTION = {
  FINANCER: 'financers',
  PROCESSOR: 'processors',
  WSP_CM: 'admins',       // WSP/CM operator accounts share the admins collection with a role tag, kept simple for Phase 1
  WSP_CM_MANAGER: 'admins',
  ADMIN: 'admins'
};

/** Simple registration for Financer/Processor/WSP-CM operator accounts (BRD §3).
 *  Admin accounts are deliberately NOT self-registrable — provisioned only via
 *  seeding/an existing admin, so there's exactly one way into the Admin
 *  portal rather than an open signup anyone could hit. */
router.post('/:role/register', asyncHandler(async (req, res) => {
  const role = req.params.role.toUpperCase();
  if (role === 'ADMIN') {
    return res.status(403).json({ error: 'Admin accounts cannot self-register. Contact an existing admin.' });
  }
  const collectionName = ROLE_TO_COLLECTION[role];
  if (!collectionName) return res.status(400).json({ error: `Unknown role: ${role}` });

  const { name, email, password, orgName, consentAccepted } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password are required' });
  if (!consentAccepted) return res.status(400).json({ error: 'You must agree to the Terms & Conditions and Privacy Policy to register' });
  const pwIssue = passwordIssue(password);
  if (pwIssue) return res.status(400).json({ error: pwIssue });

  const list = await readCollection(collectionName);
  if (list.some(p => p.email === email && p.role === role)) {
    return res.status(409).json({ error: 'Already registered with this email for this role' });
  }

  const participant = {
    id: uuid(), role, name, email, orgName: orgName || null,
    passwordHash: bcrypt.hashSync(password, 10),
    status: 'ACTIVE',
    consentAcceptedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  list.push(participant);
  await writeCollection(collectionName, list);

  const { passwordHash, ...safe } = participant;
  const token = issueToken({ sub: participant.id, role });
  res.status(201).json({ participant: safe, token });
}));

router.post('/:role/login', asyncHandler(async (req, res) => {
  const role = req.params.role.toUpperCase();
  const collectionName = ROLE_TO_COLLECTION[role];
  if (!collectionName) return res.status(400).json({ error: `Unknown role: ${role}` });

  const { email, password } = req.body;
  const list = await readCollection(collectionName);
  const participant = list.find(p => p.email === email && p.role === role);
  if (!participant || !safeCompare(password, participant.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const { passwordHash, ...safe } = participant;
  const token = issueToken({ sub: participant.id, role });
  res.json({ participant: safe, token });
}));

module.exports = router;
