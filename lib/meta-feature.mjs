// No browser override: only the tenant-scoped server feature can enable Meta.
export async function readMetaFeature() {
  try {
    const response = await fetch('/api/store-features', {cache:'no-store',signal:AbortSignal.timeout(8000)});
    return response.ok && (await response.json()).metaEventsEnabled === true;
  } catch { return false; }
}
