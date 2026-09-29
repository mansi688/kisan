/**
 * server.js — KisanUnnatti API entrypoint.
 * Wires together every BRD-lifecycle route module onto one Express app.
 * No framework magic: routes are grouped by BRD section so the mapping
 * from business requirement to code stays obvious (see README.md).
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { ensureStore } = require('./db');

const farmerRoutes = require('./routes/farmers');
const participantRoutes = require('./routes/participants');
const warehouseRoutes = require('./routes/warehouses');
const wrRoutes = require('./routes/wr');
const financingRoutes = require('./routes/financing');
const auctionRoutes = require('./routes/auction');
const settlementRoutes = require('./routes/settlement');
const dashboardRoutes = require('./routes/dashboards');
const contactRoutes = require('./routes/contact');
const demoRoutes = require('./routes/demo');

ensureStore();

const app = express();
const app = express();
// Trust Render's proxy for correct IP tracking and rate-limiting
app.set('trust proxy', 1);
const PORT = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === 'production';

// Vite's dev server defaults to port 5173, but silently picks the next free
// port (5174, 5175, ...) whenever 5173 is already taken by something else —
// extremely easy to hit without noticing, and from the browser's side it
// doesn't look like an error at all: the page loads fine, login just fails
// with a generic "Unable to connect" because the browser blocks a response
// with no matching Access-Control-Allow-Origin header before it ever reaches
// the page's JavaScript. Covering a small, harmless range of localhost dev
// ports here (both `localhost` and `127.0.0.1`, since browsers treat them as
// different origins even though they're the same machine) avoids that
// specific, common false alarm without loosening anything for a real
// deployment — CORS_ORIGIN in .env still fully overrides this list.
const DEFAULT_DEV_ORIGINS = [5173, 5174, 5175, 5176].flatMap(
  (port) => [`http://localhost:${port}`, `http://127.0.0.1:${port}`]
);
const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : DEFAULT_DEV_ORIGINS;

// Behind a reverse proxy / PaaS load balancer (Render, Railway, Fly, nginx...)
// every request appears to come from the proxy's IP unless Express is told to
// trust X-Forwarded-For — which would make the login rate limiter treat ALL
// users as one client. Opt-in (TRUST_PROXY=1) because trusting that header
// when there is NO proxy in front lets a client spoof its own IP.
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || true);

// Explicit CSP instead of helmet's defaults so the same server can serve the
// React app safely: scripts only from this origin, Google Fonts allowed for
// the two font families the design uses, nothing framed except ourselves (the
// landing page is embedded via a same-origin iframe). Kept honest: no
// 'unsafe-eval', and no 'unsafe-inline' for scripts on the app itself.
// `upgrade-insecure-requests` is opt-in (FORCE_HTTPS=true) — on plain
// http://localhost it breaks asset loading in some browsers.
const FORCE_HTTPS = process.env.FORCE_HTTPS === 'true';
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      frameSrc: ["'self'"],
      frameAncestors: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      ...(FORCE_HTTPS ? { upgradeInsecureRequests: [] } : {})
    }
  }
}));
app.use(cors({
  origin(origin, callback) {
    // No Origin header at all — a same-origin request, curl, or a server-to-
    // server call. Nothing for CORS to check; let it through.
    if (!origin) return callback(null, true);
    if (CORS_ORIGIN.includes(origin)) return callback(null, true);
    // Logged so a rejected request shows up here as a clear, actionable line
    // instead of only as a mysterious "Unable to connect" in the browser —
    // the previous static-array config gave no server-side signal at all.
    console.warn(`[CORS] Rejected request from origin "${origin}" — add it to CORS_ORIGIN in .env if this is expected.`);
    callback(null, false);
  }
}));
app.use(bodyParser.json());

// Auth endpoints (login/register/OTP) are brute-force targets — cap requests
// per IP. Generous enough for real use and for the seed/demo accounts, tight
// enough to blunt a credential-stuffing script.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts — please wait a few minutes and try again.' }
});
app.use(['/api/farmers/login', '/api/farmers/register', '/api/farmers/otp/request', '/api/farmers/otp/verify', '/api/demo/login'], authLimiter);
app.use(/^\/api\/participants\/[^/]+\/(login|register)$/, authLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'kisanunnatti-api', time: new Date().toISOString() }));

// BRD §5 — Farmer registration & KYC
app.use('/api/farmers', farmerRoutes);
// BRD §3 — Financer / Processor / WSP-CM / Admin participant accounts
app.use('/api/participants', participantRoutes);
// BRD §6 — Warehouse booking & stock intake
app.use('/api/warehouses', warehouseRoutes);
// BRD §7 — Valuation & digital WR
app.use('/api/wr', wrRoutes);
// BRD §8-10, §19 — Financing marketplace, disbursement, exposure/risk monitoring
app.use('/api/financing', financingRoutes);
// BRD §11-12 — Digital auction, price discovery, farmer decision engine
app.use('/api/auctions', auctionRoutes);
// BRD §13 — Escrow & settlement waterfall
app.use('/api/settlements', settlementRoutes);
// BRD §14-15 — Dashboards & MIS
app.use('/api/dashboards', dashboardRoutes);
// Public website — Contact form
app.use('/api/contact', contactRoutes);
// Demo Mode (master-prompt §13) — no-OTP entry into seeded demo accounts; see routes/demo.js
app.use('/api/demo', demoRoutes);

// ---------------------------------------------------------------------------
// Serve the built website (web/dist) from this same server. One process, one
// port, same origin — no CORS, no dev proxy, nothing to forget to start. This
// is also what makes the project deployable as a single unit (see Dockerfile).
// ---------------------------------------------------------------------------
const WEB_DIST = process.env.WEB_DIST || path.join(__dirname, '..', 'web', 'dist');
const hasWebBuild = fs.existsSync(path.join(WEB_DIST, 'index.html'));

if (hasWebBuild) {
  // landing.html is a self-contained document with inline scripts (Three.js
  // scene). It cannot satisfy the strict app CSP, and it has no user input or
  // dynamic content, so it gets a Report-Only policy: violations show up in
  // the browser console, but nothing is ever blocked — an enforced CSP that
  // silently broke the 3D scene would be a worse failure than what it guards.
  app.use('/landing.html', (req, res, next) => {
    res.removeHeader('Content-Security-Policy');
    res.setHeader('Content-Security-Policy-Report-Only',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'self'; object-src 'none'");
    next();
  });

  app.use(express.static(WEB_DIST, {
    index: false,
    setHeaders(res, filePath) {
      // Vite fingerprints everything under /assets, so it can be cached forever;
      // HTML must always be revalidated so a new deploy is picked up at once.
      if (/[\\/]assets[\\/]/.test(filePath)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      else res.setHeader('Cache-Control', 'no-cache');
    }
  }));

  // Client-side routes (/login, /admin/overview, ...) all get index.html and
  // React Router takes over. Anything with a file extension, and anything under
  // /api, is NOT a page — those fall through to the real JSON 404 below.
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path === '/health' || path.extname(req.path)) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(WEB_DIST, 'index.html'));
  });
}

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  // Never forward raw error text to the client — a Postgres error can name
  // tables/constraints, a bug can leak a stack trace. Full detail goes to
  // the server log above; the client gets a generic message (verbose only
  // in local dev, where NODE_ENV isn't set to "production").
  const detail = isProd ? undefined : err.message;
  res.status(err.status || 500).json({ error: 'Internal server error', ...(detail && { detail }) });
});

app.listen(PORT, () => {
  console.log(`KisanUnnatti API listening on http://localhost:${PORT}`);
  if (hasWebBuild) console.log(`Website served at http://localhost:${PORT}  (open this in your browser)`);
  else console.log('web/dist not found — running API only. Build the site with: npm run build   (or use npm run dev)');
});
