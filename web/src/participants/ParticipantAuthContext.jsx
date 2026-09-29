import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { clearAllSessions, saveParticipantSession, readParticipant, SESSION_EVENT } from '../session.js';

const Ctx = createContext(null);

/**
 * One provider instance per portal (Financer, WSP-CM, Admin). Each portal is
 * a separate route subtree, so only one of these is ever mounted at a time —
 * the participant profile persists per-role (`ku_participant_<ROLE>`), while
 * the bearer token is written to the same `ku_token` key api.js already
 * reads, so no changes were needed to the request layer.
 */
export function ParticipantAuthProvider({ role, children }) {
  const [participant, setParticipant] = useState(() => readParticipant(role));

  useEffect(() => {
    const sync = () => setParticipant(readParticipant(role));
    window.addEventListener(SESSION_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(SESSION_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [role]);

  const login = useCallback((participantData, token) => {
    saveParticipantSession(role, participantData, token);
    setParticipant(participantData);
  }, [role]);

  const logout = useCallback(() => {
    clearAllSessions(); // every role, not just this portal — see session.js
    setParticipant(null);
  }, []);

  return (
    <Ctx.Provider value={{ participant, login, logout, isAuthenticated: !!participant, role }}>
      {children}
    </Ctx.Provider>
  );
}

export function useParticipantAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useParticipantAuth must be used within a ParticipantAuthProvider');
  return ctx;
}
