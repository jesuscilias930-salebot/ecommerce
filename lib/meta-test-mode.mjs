export const META_TEST_COOKIE = 'merlyn_meta_test';
const STORAGE_KEY = 'merlyn-meta-test';
let active = false;

export function hasMetaTestCookie(cookies = '') {
  return cookies.split(';').some(part => part.trim() === `${META_TEST_COOKIE}=1`);
}

export function allowsMetaAttribution(cookies, marketing) {
  return !hasMetaTestCookie(cookies) && marketing?.testMode !== true && marketing?.consent === true;
}

export function resolveMetaTestMode(search, previous = false) {
  const values = new URLSearchParams(search).getAll('meta_test');
  // In conflicting URLs, disabling tracking takes precedence.
  if (values.includes('1')) return true;
  if (values.includes('0')) return false;
  return previous;
}

// Synchronous: every tracking entry point checks this before loading or sending.
export function isMetaTestMode() {
  if (typeof window === 'undefined') return false;
  let stored = active;
  try { stored ||= hasMetaTestCookie(document.cookie); } catch {}
  try { stored ||= sessionStorage.getItem(STORAGE_KEY) === '1'; } catch {}
  active = resolveMetaTestMode(window.location.search, stored);
  try {
    document.cookie = `${META_TEST_COOKIE}=${active ? '1' : ''}; Path=/; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}${active ? '' : '; Max-Age=0'}`;
  } catch {}
  try {
    if (active) sessionStorage.setItem(STORAGE_KEY, '1');
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
  return active;
}
