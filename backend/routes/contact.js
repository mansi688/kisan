const express = require('express');
const { v4: uuid } = require('uuid');
const { readCollection, writeCollection, appendAudit } = require('../db');
const { authRequired, requireRole } = require('../utils/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

/** Public website — Contact page submission. No auth: anyone visiting the site can reach this. */
router.post('/', asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'name, email and message are required' });
  }

  const messages = await readCollection('contactMessages');
  const record = {
    id: uuid(),
    name, email, subject: subject || '', message,
    status: 'NEW',
    createdAt: new Date().toISOString()
  };
  messages.push(record);
  await writeCollection('contactMessages', messages);
  await appendAudit({ actor: email, action: 'CONTACT_MESSAGE_SUBMITTED', entity: 'contactMessage', entityId: record.id });

  res.status(201).json({ received: true });
}));

/** Admin portal — read the inbox. */
router.get('/', authRequired, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const messages = (await readCollection('contactMessages')).slice().reverse();
  res.json(messages);
}));

module.exports = router;
