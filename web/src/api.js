import { clearAllSessions, loginPathFor } from './session.js';

const BASE = import.meta.env.VITE_API_BASE || '/api';

function authHeaders() {
  const token = localStorage.getItem('ku_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Maps a failed response to a message a person can actually act on, instead
 * of a bare "Request failed (500)". The server's own `data.error` (a specific,
 * already-meaningful message like "Invalid mobile number or password" or
 * "Password must be at least 8 characters") always wins when present —
 * this fallback only fires for the generic cases where the server sent
 * nothing more specific (a raw 500, a 429 with no body, etc).
 */
function statusMessage(status) {
  switch (status) {
    case 401: return 'Session expired. Please sign in again.';
    case 403: return 'You do not have permission to perform this action.';
    case 404: return 'The requested resource could not be found.';
    case 409: return 'This information already exists.';
    case 429: return 'Too many attempts. Please try again later.';
    case 500: return 'Something went wrong on our server. Please try again.';
    default: return `Request failed (${status})`;
  }
}

async function request(method, path, body) {
  const hadToken = !!localStorage.getItem('ku_token');
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    // fetch() itself throws on a real network failure (server down, offline,
    // DNS failure) — this never reaches an HTTP status at all.
    throw new Error('Unable to connect to KisanUnnatti. Check your connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // A 401 on anything except a login attempt means the token we sent is no
    // longer valid (expired, or the account changed). Staying "logged in" in
    // the UI with a dead token just produces a page full of failing requests,
    // so end the session properly and send the person to the right login page.
    if (res.status === 401 && hadToken && !path.endsWith('/login')) {
      clearAllSessions();
      const target = loginPathFor(window.location.pathname);
      if (window.location.pathname !== target) window.location.assign(`${target}?expired=1`);
    }
    throw new Error(data.error || statusMessage(res.status));
  }
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),

  // Farmer auth & profile
  requestOtp: (mobile) => request('POST', '/farmers/otp/request', { mobile }),
  verifyOtp: (mobile, otp) => request('POST', '/farmers/otp/verify', { mobile, otp }),
  registerFarmer: (payload) => request('POST', '/farmers/register', payload),
  loginFarmer: (mobile, password) => request('POST', '/farmers/login', { mobile, password }),
  me: () => request('GET', '/farmers/me'),

  // Warehouses
  searchWarehouses: (commodity, district) => {
    const params = new URLSearchParams();
    if (commodity) params.set('commodity', commodity);
    if (district) params.set('district', district);
    return request('GET', `/warehouses?${params.toString()}`);
  },
  bookWarehouse: (warehouseId, payload) => request('POST', `/warehouses/${warehouseId}/book`, payload),
  myBookings: () => request('GET', '/warehouses/bookings/mine'),

  // WR
  myWarehouseReceipts: (farmerId) => request('GET', `/wr?farmerId=${farmerId}`),

  // Financing
  offersForWr: (wrId) => request('GET', `/financing/offers?wrId=${wrId}`),
  selectOffer: (offerId, otp) => request('POST', `/financing/offers/${offerId}/select`, { otp }),
  loansForFarmer: (farmerId) => request('GET', `/financing/loans?farmerId=${farmerId}`),
  loanExposure: (loanId) => request('GET', `/financing/loans/${loanId}/exposure`),

  // Auctions
  auctionsOpen: () => request('GET', '/auctions?status=OPEN'),
  auctionFarmerView: (auctionId) => request('GET', `/auctions/${auctionId}/farmer-view`),
  submitDecision: (auctionId, decision) => request('POST', `/auctions/${auctionId}/decision`, { decision }),

  // Settlements
  settlementsForFarmer: (farmerId) => request('GET', `/settlements?farmerId=${farmerId}`),

  // Dashboard
  farmerDashboard: () => request('GET', '/dashboards/farmer'),

  // Participant auth (Financer / WSP-CM / Admin / Processor operator accounts)
  participantLogin: (role, email, password) => request('POST', `/participants/${role.toLowerCase()}/login`, { email, password }),
  participantRegister: (role, payload) => request('POST', `/participants/${role.toLowerCase()}/register`, payload),

  // Financer portal
  freeWarehouseReceipts: () => request('GET', '/wr?status=ACTIVE'),
  submitFinancingOffer: (payload) => request('POST', '/financing/offers', payload),
  financerOffers: (financerId) => request('GET', `/financing/offers?financerId=${financerId}`),
  financerLoans: (financerId) => request('GET', `/financing/loans?financerId=${financerId}`),
  disburseOffer: (offerId) => request('POST', `/financing/offers/${offerId}/disburse`),

  // Warehouse / WSP-CM portal
  warehousesAll: () => request('GET', '/warehouses'),
  warehouseBookings: (warehouseId) => request('GET', `/warehouses/${warehouseId}/bookings`),
  recordStockIntake: (warehouseId, payload) => request('POST', `/warehouses/${warehouseId}/stock-intake`, payload),
  stockIntakes: (params = {}) => {
    const q = new URLSearchParams(params);
    return request('GET', `/warehouses/stock-intake?${q.toString()}`);
  },
  approveStockIntake: (intakeId) => request('POST', `/warehouses/stock-intake/${intakeId}/approve`),
  issueWr: (payload) => request('POST', '/wr', payload),
  pledgedWarehouseReceipts: () => request('GET', '/wr?status=PLEDGED'),
  warehouseReceiptsAll: () => request('GET', '/wr'),

  // Admin portal
  portfolio: () => request('GET', '/dashboards/portfolio'),
  createWarehouse: (payload) => request('POST', '/warehouses', payload),
  allAuctions: (status) => request('GET', `/auctions${status ? `?status=${status}` : ''}`),
  openAuction: (payload) => request('POST', '/auctions', payload),
  settleAuction: (auctionId) => request('POST', `/settlements/${auctionId}/settle`),
  auditLog: (limit = 100) => request('GET', `/dashboards/audit-log?limit=${limit}`),

  // Public website — Contact form
  submitContactMessage: (payload) => request('POST', '/contact', payload),
  contactMessages: () => request('GET', '/contact'),

  // Demo Mode (master-prompt §13) — no-OTP entry, see backend/routes/demo.js
  demoStatus: () => request('GET', '/demo/status'),
  demoLogin: (role) => request('POST', '/demo/login', { role })
};
