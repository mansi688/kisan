const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Two known-weak values: this file's own fallback, and the literal
// placeholder shipped in .env.example — a `cp .env.example .env` that's
// never edited is exactly the real-world case this guards against, and
// checking only the code's own fallback would miss it entirely.
const WEAK_SECRETS = new Set(['dev-only-secret-change-me', 'change-this-to-a-long-random-string', '']);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';

// A forgotten or never-edited .env is how real deployments end up signing
// tokens with a secret that's sitting in plain text in this public source
// tree — anyone who's ever seen this repo could then forge a valid token
// for any role. Refuse to boot with a known-weak secret once NODE_ENV says
// this is a real deployment, rather than silently accepting it.
if (process.env.NODE_ENV === 'production' && WEAK_SECRETS.has(JWT_SECRET)) {
  console.error('[FATAL] JWT_SECRET is unset or still a placeholder value while NODE_ENV=production. Set a long random JWT_SECRET in .env before running in production.');
  process.exit(1);
}

function issueToken(payload) {
  // 12h token — the web/mobile clients re-authenticate via OTP for sensitive
  // actions (financer selection, sale acceptance) regardless of session length,
  // per BRD §17 "Farmer Acceptance: OTP/Digital consent".
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing bearer token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Requires role: ${roles.join(' or ')}` });
    }
    next();
  };
}

/**
 * Every registration endpoint calls this. Length matters more than
 * complexity for real-world password strength (NIST SP 800-63B), but a
 * "professional site" baseline commonly expected in a B2B/financial
 * context is at least a minimum length plus some mix of character types
 * — not every rule at once (that pushes people toward predictable
 * substitutions like "Password1!"), but at least 3 of the 4 common
 * classes, which blocks the weakest common patterns (all-lowercase
 * dictionary words, digits-only PINs) without demanding a specific
 * special character or capitalization position.
 */
function passwordIssue(password) {
  if (!password || password.length < 8) return 'Password must be at least 8 characters';
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) => re.test(password)).length;
  if (classes < 3) return 'Password must include at least 3 of: lowercase letters, uppercase letters, numbers, symbols';
  return null;
}

/**
 * bcrypt.compareSync THROWS (not just returns false) when the stored hash
 * is missing, null, or not a well-formed bcrypt hash — e.g. a data file
 * left over from an older schema, or a record edited/created outside the
 * normal registration path. Every login route calls this instead of
 * bcrypt.compareSync directly, so a malformed stored hash fails the login
 * (401) rather than crashing the request (500).
 */
function safeCompare(password, hash) {
  if (typeof hash !== 'string' || !hash) return false;
  try {
    return bcrypt.compareSync(password || '', hash);
  } catch {
    return false;
  }
}

module.exports = { issueToken, authRequired, requireRole, passwordIssue, safeCompare, JWT_SECRET };
