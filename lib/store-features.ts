import 'server-only';
import {stockApi} from './product-catalog';
import {normalizeStoreFeatures,type StoreFeatures} from './store-feature-values';

// Fail closed for optional features. The existing WhatsApp checkout is unaffected.
export async function getStoreFeatures():Promise<StoreFeatures> {
 try {
  const data=await stockApi('/public/store/features');
  return normalizeStoreFeatures(data);
 } catch {return normalizeStoreFeatures(null);}
}
