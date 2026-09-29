/**
 * Single source of truth for who is logged in.
 *
 * There is exactly ONE bearer token (`ku_token`) but each role also keeps a
 * cached profile (`ku_farmer`, `ku_participant_FINANCER`, ...). Previously
 * each role's login/logout only touched its OWN profile key while overwriting/
 * deleting the shared token — so logging out of Admin left a stale farmer
 * profile behind (farmer sidebar still showing, token gone), and logging in
 * as a second role left the first role's profile pointing at a token that
 * now belonged to someone else.
 *
 * The rule now: one person, one session. Any login replaces every other
 * stored profile; any logout, expiry, or 401 clears all of them.
 */
const TOKEN = 'ku_token';
const FARMER = 'ku_farmer';
const PARTICIPANT_PREFIX = 'ku_participant_';
export const SESSION_EVENT = 'ku-session-changed';

function notify() {
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function clearAllSessions({ silent = false } = {}) {
  const doomed = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k === TOKEN || k === FARMER || (k && k.startsWith(PARTICIPANT_PREFIX))) doomed.push(k);
  }
  doomed.forEach((k) => localStorage.removeItem(k));
  if (!silent) notify();
}

export function saveFarmerSession(farmer, token) {
  clearAllSessions({ silent: true });
  localStorage.setItem(TOKEN, token);
  localStorage.setItem(FARMER, JSON.stringify(farmer));
  notify();
}

export function saveParticipantSession(role, participant, token) {
  clearAllSessions({ silent: true });
  localStorage.setItem(TOKEN, token);
  localStorage.setItem(PARTICIPANT_PREFIX + role, JSON.stringify(participant));
  notify();
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null; // corrupted value — behave as logged out rather than crash the app
  }
}

export const readFarmer = () => (localStorage.getItem(TOKEN) ? readJson(FARMER) : null);
export const readParticipant = (role) => (localStorage.getItem(TOKEN) ? readJson(PARTICIPANT_PREFIX + role) : null);

/** Which login page belongs to the part of the site the person was in. */
export function loginPathFor(pathname) {
  if (pathname.startsWith('/financer')) return '/financer/login';
  if (pathname.startsWith('/wsp')) return '/wsp/login';
  if (pathname.startsWith('/admin')) return '/admin/login';
  return '/login';
}

export const expiredMessage = () =>
  new URLSearchParams(window.location.search).get('expired') ? 'Your session expired. Please sign in again.' : '';
