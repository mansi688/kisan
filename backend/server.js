/**
 * server.js — KisanUnnatti API entrypoint.
 * Wires together every BRD-lifecycle route module onto one Express app.
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

// --- SINGLE APP INITIALIZATION & PROXY FIX ---
const app = express();
app.set('trust proxy', 1);

const PORT = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === 'production';

const DEFAULT_DEV_ORIGINS = [5173, 5174, 5175, 5176].flatMap(
  (port) => [`http://localhost:${port}`, `http://127.0.0.1:${port}`]
);

const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : DEFAULT_DEV_ORIGINS;

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
    if (!origin) return callback(null, true);
    if (CORS_ORIGIN.includes(origin)) return callback(null, true);
    console.warn(`[CORS] Rejected request from origin "${origin}" — add it to CORS_ORIGIN in environment variables if this is expected.`);
    callback(null, false);
  }
}));

app.use(bodyParser.json());

// Auth rate limiter
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

// Routes
app.use('/api/farmers', farmerRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/wr', wrRoutes);
app.use('/api/financing', financingRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/demo', demoRoutes);

// Static frontend serving
const WEB_DIST = process.env.WEB_DIST || path.join(__dirname, '..', 'web', 'dist');
const hasWebBuild = fs.existsSync(path.join(WEB_DIST, 'index.html'));

if (hasWebBuild) {
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
      if (/[\\/]assets[\\/]/.test(filePath)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      else res.setHeader('Cache-Control', 'no-cache');
    }
  }));

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
  const detail = isProd ? undefined : err.message;
  res.status(err.status || 500).json({ error: 'Internal server error', ...(detail && { detail }) });
});

app.listen(PORT, () => {
  console.log(`KisanUnnatti API listening on http://localhost:${PORT}`);
  if (hasWebBuild) console.log(`Website served at http://localhost:${PORT} (open this in your browser)`);
  else console.log('web/dist not found — running API only. Build the site with: npm run build');
});