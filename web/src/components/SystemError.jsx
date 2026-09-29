import React from 'react';

/**
 * The "something broke" experience (Part 18) — deliberately NOT the same
 * component as NotFound.jsx (Part 37 says legal/error pages shouldn't look
 * like a dashboard, and a crash page shouldn't look like "you took a wrong
 * turn" either; this one leads with an apology and a retry, not navigation
 * options first). Never shown the stack trace, error message, or component
 * name — those go to the console for a developer to find, never to the
 * person looking at the screen.
 */
export default function SystemError({ onRetry }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      padding: '2rem', background: 'var(--paper)', color: 'var(--ink)'
    }}>
      <img src="/logo.webp" alt="KisanUnnatti" style={{ width: 56, height: 56, marginBottom: '1.5rem' }} />
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: '0.6rem' }}>Something went wrong</h1>
      <p style={{ color: 'var(--ink-soft)', maxWidth: '40ch', marginBottom: '1.8rem' }}>
        Please try again. If this keeps happening, contact support and let us know what you were doing.
      </p>
      <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn btn-wheat" onClick={onRetry}>Try Again</button>
        {/* Plain <a> tags, not <Link> — deliberately. This renders when
            something in the React tree has already broken, so a full page
            reload is the one recovery path that doesn't depend on React
            Router's own context still being in a working state. */}
        <a href="/" className="btn btn-outline">Return Home</a>
        <a href="/contact" className="btn btn-outline">Contact Support</a>
      </div>
    </div>
  );
}
