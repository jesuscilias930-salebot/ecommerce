# Store domains

All calls to SockControl resolve `X-Store-Tenant` on the Next.js server from
the incoming `Host` header, using `STOREFRONT_DOMAIN_TENANTS`.
The browser cannot choose a tenant through a body, query parameter or header.
`X-Forwarded-Host` is deliberately not used.

Example for Render (replace the tenant, then paste as one environment value):

```json
{"tienda.merlyncilias.com":"TENANT_REAL","merlyncilias.com":"TENANT_REAL"}
```

Register only domains you control and have configured on the service. Add the
actual `your-service.onrender.com` host explicitly if it should be usable before
DNS activation. There are no wildcard or production defaults. Domains are
case-insensitive and ports are part of the match. Tenant IDs may contain letters,
digits, underscores and hyphens (1–100 characters). Restart/redeploy after edits.

For a local `.env.local` with custom ports:

```dotenv
STOREFRONT_DOMAIN_TENANTS='{"localhost:3000":"tienda-local","localhost:3002":"tienda-local"}'
```

Without a map, only `NODE_ENV=development` provides local defaults for port 3000
(`localhost`, `127.0.0.1`, `[::1]`). Production, including `next start`, requires
an explicit map. Mock catalogs follow the same rule.

This maps public storefront identity; it is NOT authentication. SockControl must
still enforce tenant ownership and authentication for administrative operations.
The deployment ingress must accept only the configured custom domains and
preserve their Host. Do not enable arbitrary forwarded-host trust to fix a proxy.
Aliases share the backend tenant, but browser cart storage remains per-origin;
use a canonical-domain redirect before advertising an alias.

Deployment checks:
1. Set the map and keep STORE_FEATURE_TENANT in SockControl aligned with the
   real tenant of this shop. Existing CRM/Stripe settings still support the
   configured shop, not automatically every tenant in this map.
2. Verify catalog, prices, postal lookup, shipping, order and payment-status calls.
3. Verify an unregistered Host cannot retrieve any catalog or call SockControl.
4. Never add real credentials to the map or expose it as NEXT_PUBLIC_*.

POST /api/shipping-quote and /api/orders validate Origin against the allowlisted
Host, not request.url (which may be internal HTTP behind Render). Origin must
be HTTPS in production and exactly match the public Host, including port.
Missing/opaque origins and explicit cross-site fetch metadata are rejected.
Forwarded headers never authorize a request. HTTP loopback is allowed only in
development. This retains the browser cross-origin protection; it is not API
authentication. If a proxy rewrites Host, fix ingress preservation rather than
trusting a caller-provided X-Forwarded-Host.

Regression tests: `node --test tests/store-domain.test.mjs tests/store-origin.test.mjs`.
