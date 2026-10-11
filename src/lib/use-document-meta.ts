import { useEffect } from 'react';

const SITE_URL = 'https://removeai.missionhacker.com';

function setMetaTag(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(path: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', `${SITE_URL}${path}`);
}

/** Sets document.title, the meta description, and a canonical link for the current route.
 * Each page calls this once with its own values - nothing is shared across routes. */
export function useDocumentMeta(title: string, description: string, path: string) {
  useEffect(() => {
    document.title = title;
    setMetaTag('description', description);
    setCanonical(path);
  }, [title, description, path]);
}
