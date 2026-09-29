import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles.css';

/**
 * Without this, logging out and then pressing the browser's Back button
 * can show a stale, frozen picture of whatever authenticated page was open
 * before logout — sidebar, dashboard content and all — even though the
 * person is genuinely logged out and the real page underneath is correct.
 * This isn't a React bug: modern browsers can restore a page from the
 * back/forward cache (bfcache) as a full snapshot of the DOM exactly as it
 * looked when the person navigated away, without re-running any JavaScript
 * — so React never gets a chance to re-check auth state and re-render.
 * `pageshow`'s `persisted` flag is true specifically when a page was
 * restored this way (never true on a normal fresh load), so this only
 * forces a real reload in exactly the case that would otherwise show
 * stale, potentially logged-out-but-still-visible content — every normal
 * navigation is completely unaffected.
 */
window.addEventListener('pageshow', (event) => {
  if (event.persisted) window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
