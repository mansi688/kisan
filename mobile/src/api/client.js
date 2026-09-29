import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Falls back to the Android-emulator loopback address for the host machine's
// localhost. Override via app.json -> expo.extra.apiBaseUrl for a physical
// device or a deployed API.
const BASE = Constants.expoConfig?.extra?.apiBaseUrl || 'http://10.0.2.2:4000/api';

async function authHeaders() {
  const token = await AsyncStorage.getItem('ku_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  requestOtp: (mobile) => request('POST', '/farmers/otp/request', { mobile }),
  verifyOtp: (mobile, otp) => request('POST', '/farmers/otp/verify', { mobile, otp }),
  registerFarmer: (payload) => request('POST', '/farmers/register', payload),
  loginFarmer: (mobile, password) => request('POST', '/farmers/login', { mobile, password }),

  searchWarehouses: (commodity, district) => {
    const params = new URLSearchParams();
    if (commodity) params.set('commodity', commodity);
    if (district) params.set('district', district);
    return request('GET', `/warehouses?${params.toString()}`);
  },
  bookWarehouse: (warehouseId, payload) => request('POST', `/warehouses/${warehouseId}/book`, payload),
  myBookings: () => request('GET', '/warehouses/bookings/mine'),

  offersForWr: (wrId) => request('GET', `/financing/offers?wrId=${wrId}`),
  selectOffer: (offerId, otp) => request('POST', `/financing/offers/${offerId}/select`, { otp }),
  loanExposure: (loanId) => request('GET', `/financing/loans/${loanId}/exposure`),

  auctionsOpen: () => request('GET', '/auctions?status=OPEN'),
  auctionFarmerView: (auctionId) => request('GET', `/auctions/${auctionId}/farmer-view`),
  submitDecision: (auctionId, decision) => request('POST', `/auctions/${auctionId}/decision`, { decision }),

  settlementsForFarmer: (farmerId) => request('GET', `/settlements?farmerId=${farmerId}`),
  farmerDashboard: () => request('GET', '/dashboards/farmer')
};
