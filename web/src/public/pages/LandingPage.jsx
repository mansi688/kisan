import React from 'react';
import Seo from '../../components/Seo.jsx';

/**
 * The cinematic landing experience lives at public/landing.html — a fully
 * self-contained document (own <html>/<head>, inlined Three.js, its own
 * scroll-driven WebGL scene) rather than a React component. Embedding it
 * via iframe, instead of trying to port a hand-rolled WebGL animation loop
 * into React's render/unmount lifecycle, keeps its careful scroll
 * choreography completely intact and avoids any collision between its
 * global styles/script and the app shell's own CSS variables.
 *
 * Its internal nav/CTA links (Login, Get Started, Enter Platform, Enter
 * Kisan Unnati) carry target="_top" so they navigate this whole tab into
 * the real app instead of trying to load /login inside the iframe itself.
 */
export default function LandingPage() {
  return (
    <>
      <Seo description="Digital commodity pledge finance, warehouse receipts and price discovery for farmers, financers and warehouse operators." />
      <iframe
        src="/landing.html"
        title="KisanUnnatti — Your Harvest. Your Capital. Your Choice."
        style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', border: 'none', display: 'block' }}
      />
    </>
  );
}
