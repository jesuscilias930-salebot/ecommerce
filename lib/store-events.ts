import {MARKETING_CONSENT_KEY} from './meta-attribution';
import {readMetaFeature} from './meta-feature.mjs';
export type StoreEvent='ViewContent'|'AddToCart'|'InitiateCheckout'|'ConfigurationStarted'|'ConfigurationCompleted'|'ShippingQuoted'|'ShippingSelected'|'WhatsAppClick'|'PendingOrderCreated';
export type EventData={id?:number;quantity?:number;value?:number;mode?:'assorted'|'custom';rateCount?:number};
const names=new Set<StoreEvent>(['ViewContent','AddToCart','InitiateCheckout','ConfigurationStarted','ConfigurationCompleted','ShippingQuoted','ShippingSelected','WhatsAppClick','PendingOrderCreated']);
const sent=new Set<string>(),pending=new Set<string>();
export function eventPayload(data:EventData){
 const safe:Record<string,unknown>={currency:'MXN'};
 if(Number.isSafeInteger(data.id)&&data.id!==0)safe.content_ids=[String(data.id)];
 if(Number.isSafeInteger(data.quantity)&&data.quantity!>0)safe.num_items=data.quantity;
 if(Number.isFinite(data.value)&&data.value!>=0)safe.value=Math.round(data.value!*100)/100;
 if(data.mode==='assorted'||data.mode==='custom')safe.configuration_mode=data.mode;
 if(Number.isSafeInteger(data.rateCount)&&data.rateCount!>=0)safe.rate_count=data.rateCount;
 return safe;
}
// Never queue events before consent; never send Purchase here (server owns paid conversion).
export async function trackStoreEvent(name:StoreEvent,data:EventData={},once?:string){
 if(typeof window==='undefined'||!names.has(name)||once&&(sent.has(once)||pending.has(once)))return;
 const allowed=()=>localStorage.getItem(MARKETING_CONSENT_KEY)==='accepted'&&['tienda.merlyncilias.com','ecommerce-9w7o.onrender.com'].includes(location.hostname)&&!location.pathname.startsWith('/pago/')&&![...new URLSearchParams(location.search).keys()].some(k=>/token|session|email|phone|address/i.test(k));
 try{
  if(!allowed()||!window.fbq||!window.merlynMetaReady)return;
  if(once)pending.add(once);
  if(!await readMetaFeature()||!allowed()||!window.merlynMetaReady)return;
  window.fbq?.(['ViewContent','AddToCart','InitiateCheckout'].includes(name)?'track':'trackCustom',name,eventPayload(data));
  if(once){sent.add(once);if(sent.size>500)sent.delete(sent.values().next().value!);}
 }catch{/* Analytics must not block buying. */}finally{if(once)pending.delete(once);}
}
