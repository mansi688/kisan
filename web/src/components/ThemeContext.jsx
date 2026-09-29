import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'ku_theme'; // 'light' | 'dark' | 'system'

function systemPrefersDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(mode) {
  const resolved = mode === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : mode;
  document.documentElement.setAttribute('data-theme', resolved);
  return resolved;
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => localStorage.getItem(STORAGE_KEY) || 'system');
  const [resolved, setResolved] = useState(() => applyTheme(mode));

  const setMode = useCallback((next) => {
    localStorage.setItem(STORAGE_KEY, next);
    setModeState(next);
    setResolved(applyTheme(next));
  }, []);

  // Keep in sync with the OS setting live while mode === 'system'
  useEffect(() => {
    if (mode !== 'system' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setResolved(applyTheme('system'));
    mq.addEventListener ? mq.addEventListener('change', onChange) : mq.addListener(onChange);
    return () => {
      mq.removeEventListener ? mq.removeEventListener('change', onChange) : mq.removeListener(onChange);
    };
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
