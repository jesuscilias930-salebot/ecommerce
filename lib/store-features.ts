import 'server-only';
import {stockApi} from './product-catalog';

// Fail closed: WhatsApp remains available if the feature bridge is unavailable.
export async function getStoreFeatures():Promise<{cardPaymentsEnabled:boolean;metaEventsEnabled:boolean}> {
 try {
  const data=await stockApi('/public/store/features');
  return {cardPaymentsEnabled:data.cardPaymentsEnabled===true,metaEventsEnabled:data.metaEventsEnabled===true};
 } catch {return {cardPaymentsEnabled:false,metaEventsEnabled:false};}
}
