import React from 'react';
import Seo from '../../components/Seo.jsx';

export default function Accessibility() {
  return (
    <section className="pub-section pub-section-narrow legal-page">
      <Seo title="Accessibility Statement" description="What KisanUnnatti actually implements for keyboard navigation, focus visibility, labelled forms and reduced motion." />
      <p className="pub-eyebrow">Legal</p>
      <h1 className="pub-h1" style={{ maxWidth: '18ch' }}>Accessibility Statement</h1>
      <p className="pub-lede">Last updated: placeholder — replace with a reviewed date once this statement is kept current against an actual audit.</p>
      <div className="pub-body">
        <h3>Our commitment</h3>
        <p>KisanUnnatti is built with semantic HTML, visible keyboard focus, and labelled form controls throughout — not as an afterthought layered on at the end. This page describes what's actually implemented today, not a target or a certification.</p>

        <h3>Keyboard navigation</h3>
        <p>Every interactive element — links, buttons, form fields, the password show/hide toggle, the mobile navigation drawer — is reachable and operable by keyboard alone, in a logical order that follows the page's visual layout.</p>

        <h3>Focus visibility</h3>
        <p>Focused elements show a visible outline (buttons, links, form inputs, the password toggle) rather than relying on color or a subtle border change alone.</p>

        <h3>Forms</h3>
        <p>Every input has an associated, visible label. The password show/hide control announces its current action to assistive technology ("Show password" / "Hide password") rather than being a bare icon with no accessible name.</p>

        <h3>Color and contrast</h3>
        <p>Status is never communicated by color alone — a verified warehouse receipt shows a checkmark and the word "Verified", not just a green color; risk status on a loan is shown as text ("GREEN"/"AMBER"/"RED"), not a colored dot on its own.</p>

        <h3>Reduced motion</h3>
        <p>Dark mode and every dashboard, form, and table respect your device's <code>prefers-reduced-motion</code> setting where animation is used.</p>

        <h3>What hasn't been independently verified</h3>
        <p>No formal WCAG conformance audit or third-party accessibility review has been performed. This statement describes implementation choices, not a compliance certification — treat it accordingly until an actual audit has been done.</p>

        <h3>Reporting an issue</h3>
        <p>If something on this platform is hard to use with a keyboard, screen reader, or other assistive technology, use the <a href="/contact">Contact</a> page to let us know — include the page and what happened, and it'll be looked at directly rather than filed away.</p>

        <p style={{ fontSize: '0.82rem', color: 'var(--ink-faint)', marginTop: '2rem' }}>
          This page describes the current implementation as accurately as possible — it is not a legal accessibility certification.
        </p>
      </div>
    </section>
  );
}
