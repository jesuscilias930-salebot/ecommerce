import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeStoreFeatures,storeWhatsappHref} from '../lib/store-feature-values.ts';
import {readStoreFeatures} from '../lib/meta-feature.mjs';
test('floating button uses a local WhatsApp logo without changing its accessible label',()=>{
 const source=readFileSync(new URL('../components/floating-whatsapp.tsx',import.meta.url),'utf8');
 assert.match(source,/<svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">/);
 assert.match(source,/<span>Comprar por WhatsApp<\/span>/);
 assert.doesNotMatch(source,/MessageCircle|<img|<script/);
});
test('WhatsApp is hidden for old servers, invalid values, and disabled configuration',()=>{
 for(const data of [null,{}, {whatsappButtonEnabled:true}, {whatsappButtonEnabled:'true',whatsappNumber:'522721285563'}, {whatsappButtonEnabled:false,whatsappNumber:'522721285563'}, ...['https://evil.test','0123456789','123','1'.repeat(16)].map(whatsappNumber=>({whatsappButtonEnabled:true,whatsappNumber}))]){
  const safe=normalizeStoreFeatures(data);
  assert.equal(safe.whatsappButtonEnabled,false);assert.equal(safe.whatsappNumber,'');assert.equal(storeWhatsappHref(safe),null);
 }
});
test('WhatsApp URL can only target wa.me and contains no customer or payment details',()=>{
 const features=normalizeStoreFeatures({whatsappButtonEnabled:true,whatsappNumber:'522721285563',metaEventsEnabled:false,cardPaymentsEnabled:true});
 const url=new URL(storeWhatsappHref(features));
 assert.equal(url.origin,'https://wa.me');assert.equal(url.pathname,'/522721285563');
 assert.match(url.searchParams.get('text'),/quiero comprar/);
 assert.equal(features.cardPaymentsEnabled,true);assert.equal(features.metaEventsEnabled,false);
});
test('one feature read returns both controls and fails closed on outages',async()=>{
 const original=globalThis.fetch;let calls=0;
 try {
  globalThis.fetch=async(url,options)=>{calls++;assert.equal(url,'/api/store-features');assert.equal(options.cache,'no-store');return {ok:true,json:async()=>({whatsappButtonEnabled:true,whatsappNumber:'522721285563',metaEventsEnabled:true})};};
  const features=await readStoreFeatures();assert.equal(calls,1);assert.equal(features.metaEventsEnabled,true);assert.equal(features.whatsappButtonEnabled,true);
  globalThis.fetch=async()=>{throw Error('offline');};assert.equal((await readStoreFeatures()).whatsappButtonEnabled,false);
  globalThis.fetch=async()=>({ok:false});assert.equal((await readStoreFeatures()).whatsappButtonEnabled,false);
 } finally {globalThis.fetch=original;}
});
