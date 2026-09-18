// Pure resolver, shared by the server adapter and its regression tests.
export function resolveStoreDomain(host, config, development = false) {
  const fail = () => { throw new Error('Dominio de tienda no configurado.'); };
  const normalize = value => {
    if (typeof value !== 'string' || value !== value.trim() || !value || value.length > 260 || /[\s,/@?#\\]/.test(value)) return fail();
    // Match exact host AND port. No suffix matching or wildcard tenants.
    if (!/^(?:localhost|(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[::1\])(?::[0-9]{1,5})?$/i.test(value)) return fail();
    const url = new URL(`http://${value}`);
    return url.host.toLowerCase();
  };
  const domain = normalize(host);
  let parsed;
  try { parsed = config ? JSON.parse(config) : (development ? { 'localhost:3000': 'tienda-local', '127.0.0.1:3000': 'tienda-local', '[::1]:3000': 'tienda-local' } : {}); }
  catch { return fail(); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fail();
  const domains = new Map();
  for (const [key, tenant] of Object.entries(parsed)) {
    const normalized = normalize(key);
    if (domains.has(normalized) || typeof tenant !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(tenant)) return fail();
    domains.set(normalized, tenant);
  }
  const tenant = domains.get(domain);
  if (!tenant) return fail();
  return tenant;
}
