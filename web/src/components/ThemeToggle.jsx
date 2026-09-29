import React from 'react';
import { useTheme } from './ThemeContext.jsx';

const OPTIONS = [
  { mode: 'light', label: '☀', title: 'Light' },
  { mode: 'dark', label: '🌙', title: 'Dark' },
  { mode: 'system', label: '🌓', title: 'System' }
];

/** variant="panel" for use on the dark sidebar/nav surface; default for use on regular content. */
export default function ThemeToggle({ variant = 'default' }) {
  const { mode, setMode } = useTheme();
  const onPanel = variant === 'panel';

  return (
    <div
      role="group"
      aria-label="Theme"
      style={{
        display: 'inline-flex',
        border: `1px solid ${onPanel ? 'rgba(255,255,255,0.2)' : 'var(--line)'}`,
        borderRadius: '20px',
        padding: '2px',
        gap: '2px'
      }}
    >
      {OPTIONS.map(({ mode: m, label, title }) => {
        const active = mode === m;
        return (
          <button
            key={m}
            type="button"
            title={title}
            aria-label={`${title} theme`}
            aria-pressed={active}
            onClick={() => setMode(m)}
            style={{
              border: 'none',
              cursor: 'pointer',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              fontSize: '0.85rem',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: active ? (onPanel ? 'rgba(255,255,255,0.16)' : 'var(--wheat-soft)') : 'transparent',
              color: onPanel ? 'var(--panel-text)' : 'var(--ink)'
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
