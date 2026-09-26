import test from 'node:test';
import assert from 'node:assert/strict';
import {readMetaFeature} from '../lib/meta-feature.mjs';
import {checkoutAttribution} from '../lib/meta-attribution.ts';
test('only explicit server enablement permits Meta; failures fail closed',async()=>{
 const old=globalThis.fetch;
 try{
  for(const value of [false,undefined,'true',1,true]){
   globalThis.fetch=async(url,options)=>{assert.equal(url,'/api/store-features');assert.equal(options.cache,'no-store');return {ok:true,json:async()=>({metaEventsEnabled:value})};};
   assert.equal(await readMetaFeature(),value===true);
  }
  globalThis.fetch=async()=>{throw Error('offline');};assert.equal(await readMetaFeature(),false);
  globalThis.fetch=async()=>({ok:false});assert.equal(await readMetaFeature(),false);
 }finally{globalThis.fetch=old;}
});
test('checkout ignores old test query and obeys CRM even with accepted advertising cookies',async()=>{
 const original={window:globalThis.window,document:globalThis.document,localStorage:globalThis.localStorage,fetch:globalThis.fetch};
 globalThis.window={location:{hostname:'tienda.merlyncilias.com',search:'?meta_test=0'}};
 globalThis.document={cookie:'_fbp=fb.1.1720000000000.123; merlyn_meta_test=1'};
 globalThis.localStorage={getItem:()=> 'accepted'};
 try{
  globalThis.fetch=async()=>({ok:true,json:async()=>({metaEventsEnabled:false})});
  assert.equal(await checkoutAttribution(),undefined);
  globalThis.fetch=async()=>({ok:true,json:async()=>({metaEventsEnabled:true})});
  assert.equal((await checkoutAttribution()).consent,true);
  globalThis.localStorage={getItem:()=> 'rejected'};assert.equal(await checkoutAttribution(),undefined);
 }finally{for(const [key,value]of Object.entries(original)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});
