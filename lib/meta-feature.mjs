import {normalizeStoreFeatures} from './store-feature-values.ts';
// One shared read for Meta and the floating WhatsApp button; no browser overrides.
export async function readStoreFeatures() {
  try {
    const response = await fetch('/api/store-features', {cache:'no-store',signal:AbortSignal.timeout(8000)});
    return normalizeStoreFeatures(response.ok ? await response.json() : null);
  } catch { return normalizeStoreFeatures(null); }
}
export async function readMetaFeature() { return (await readStoreFeatures()).metaEventsEnabled; }
