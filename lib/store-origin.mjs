import {resolveStoreDomain} from './store-domain.mjs';

// Render terminates HTTPS before Next.js. request.url may therefore be internal.
// Use the same allowlisted Host as tenant resolution; never trust forwarded headers.
export function isAllowedStoreOrigin(request, config, development = false) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || origin === 'null' || !host) return false;
  try {
    resolveStoreDomain(host, config, development);
    const url = new URL(origin);
    if (url.origin !== origin || url.host !== host.toLowerCase()) return false;
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (url.protocol !== 'https:' && !(development && local && url.protocol === 'http:')) return false;
    const site = request.headers.get('sec-fetch-site');
    return !site || site === 'same-origin';
  } catch {
    return false;
  }
}
