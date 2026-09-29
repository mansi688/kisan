import { useEffect } from 'react';

const SITE_NAME = 'KisanUnnatti';

function setMeta(name, content, attr = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Sets a unique <title>, meta description, canonical URL and Open Graph
 * tags per page — every public page was previously showing the same
 * static title from index.html regardless of which page was actually
 * open, with no canonical link at all. No routing/SSR dependency needed
 * for a client-rendered SPA: this just runs on mount/prop-change via
 * useEffect.
 *
 * The canonical URL is built from window.location (origin + pathname,
 * query string and hash stripped) rather than a hardcoded domain — the
 * real production domain isn't fixed yet (see sitemap.xml's own
 * [DEPLOYMENT DOMAIN TO BE CONFIGURED] note), so deriving it from
 * wherever the app is actually being served keeps it correct in dev,
 * staging, or production without needing to update this file later.
 *
 * title: the page-specific part only — "About" not "About | KisanUnnatti".
 * The " | KisanUnnatti" suffix is added here, once, so every page is
 * guaranteed consistent rather than each page remembering to add it.
 */
export default function Seo({ title, description }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Digital Commodity Finance`;
    document.title = fullTitle;
    const canonicalUrl = `${window.location.origin}${window.location.pathname}`;
    setCanonical(canonicalUrl);
    setMeta('og:url', canonicalUrl, 'property');
    if (description) {
      setMeta('description', description);
      setMeta('og:description', description, 'property');
    }
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:site_name', SITE_NAME, 'property');
  }, [title, description]);

  return null;
}
