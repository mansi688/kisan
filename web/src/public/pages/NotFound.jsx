import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '../../components/Seo.jsx';

export default function NotFound() {
  return (
    <section className="pub-section pub-section-narrow" style={{ textAlign: 'center' }}>
      <Seo title="Page Not Found" description="The page you're looking for doesn't exist or may have moved." />
      <p className="pub-eyebrow">404</p>
      <h1 className="pub-h1" style={{ maxWidth: '18ch', margin: '0 auto' }}>Page not found</h1>
      <p className="pub-lede" style={{ margin: '0 auto' }}>
        The page you're looking for doesn't exist, may have moved, or the link that brought you
        here might be out of date.
      </p>
      <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.8rem' }}>
        <Link to="/" className="btn btn-wheat">Return Home</Link>
        <Link to="/demo" className="btn btn-outline">Explore Platform</Link>
        <Link to="/contact" className="btn btn-outline">Contact Support</Link>
      </div>
    </section>
  );
}
