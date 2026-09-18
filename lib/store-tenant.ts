import 'server-only';
import { headers } from 'next/headers';
import { resolveStoreDomain } from './store-domain.mjs';

export async function getStoreTenant(): Promise<string> {
  const incoming = await headers();
  // Never trust a caller-supplied X-Store-Tenant or X-Forwarded-Host.
  return resolveStoreDomain(incoming.get('host'), process.env.STOREFRONT_DOMAIN_TENANTS, process.env.NODE_ENV === 'development');
}
