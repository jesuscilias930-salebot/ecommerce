import 'server-only';
import {stockApi} from './product-catalog';

// Fail closed: WhatsApp remains available if the feature bridge is unavailable.
export async function getStoreFeatures():Promise<{cardPaymentsEnabled:boolean}> {
 try {
  const data=await stockApi('/public/store/features');
  return {cardPaymentsEnabled:data.cardPaymentsEnabled===true};
 } catch {return {cardPaymentsEnabled:false};}
}
