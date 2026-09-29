import React from 'react';
import AudiencePage from './AudiencePage.jsx';

export default function ForWarehouses() {
  return (
    <AudiencePage
      eyebrow="For Warehouses"
      title="Turn stock intake into a defensible digital record"
      lede="Record bookings and intake through one workflow, and let the platform compute eligible quantity and hold exceptions for sign-off — instead of a spreadsheet nobody fully trusts."
      points={[
        ['What do I actually record?', 'Bags, gross and tare weight, and quality parameters (moisture, foreign matter) at intake. Net eligible quantity is computed automatically from what you enter — not typed in separately.'],
        ['What happens with an exception?', 'If the reject percentage is unusually high, or net weight comes out at zero or below, the intake is held as pending — a second sign-off is required before a warehouse receipt can be issued against it.'],
        ['How do I issue a receipt?', 'Once an intake is verified, issue the WR with the approved market rate and its source. The value — quantity × rate — is computed server-side, not typed in as a number.'],
        ['What do I see day to day?', 'Total and available capacity across your warehouses, pending bookings, pending intake, and active receipts — all from real data, not a static report.']
      ]}
      ctaText="Register your Warehouse"
      ctaTo="/wsp/register"
    />
  );
}
