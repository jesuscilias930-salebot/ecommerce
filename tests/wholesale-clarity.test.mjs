import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(specifier,context,next){try{return next(specifier,context);}catch(error){if(error.code==='ERR_MODULE_NOT_FOUND'&&specifier.startsWith('.'))return next(specifier+'.ts',context);throw error;}}});
const {lowestTier,nextDiscount,fixedPairsInCart,halfSelection}=await import('../lib/price-preview.ts');
const {eventPayload,trackStoreEvent}=await import('../lib/store-events.ts');
const tiers=[{minQuantity:1,maxQuantity:49,pricePerUnit:10},{minQuantity:50,maxQuantity:99,pricePerUnit:9},{minQuantity:100,maxQuantity:null,pricePerUnit:8}];
test('minimum price always carries its volume; next discount uses selected plus cart quantity',()=>{
 assert.equal(lowestTier(tiers).minQuantity,100);
 assert.deepEqual(nextDiscount(tiers,75,9),{quantity:100,missing:25,price:8,savingPerUnit:1});
 assert.equal(nextDiscount(tiers,100,8),null);assert.equal(lowestTier([]),undefined);
});
test('stock counts exact custom selection and loose pairs without guessing automatic assortment',()=>{
 const lines=[{id:10,quantity:2,selection:[{productId:2,quantity:30}]},{id:10,quantity:1},{id:-2,quantity:5}];
 assert.equal(fixedPairsInCart(2,lines,[{id:10,items:[{productId:2,quantity:50,assorted:true}]}]),65);
});
test('half shortcut requires two options, even total and enough stock for every box',()=>{
 const variants=[{id:1,currentStock:50},{id:2,currentStock:50}];
 assert.deepEqual(halfSelection(50,2,variants,[],[]),[{productId:1,quantity:25},{productId:2,quantity:25}]);
 assert.equal(halfSelection(51,1,variants,[],[]),null);
 assert.equal(halfSelection(50,3,variants,[],[]),null);
 assert.equal(halfSelection(50,2,variants,[{id:-2,quantity:1}],[]),null);
 assert.equal(halfSelection(50,1,[...variants,{id:3,currentStock:20}],[],[]),null);
});
test('analytics allowlist discards personal data, arbitrary names and tokens',()=>{
 assert.deepEqual(eventPayload({id:2,quantity:1,value:12.345,mode:'custom',email:'private@example.com',phone:'secret',address:'private',token:'secret'}),{currency:'MXN',content_ids:['2'],num_items:1,value:12.35,configuration_mode:'custom'});
 assert.deepEqual(eventPayload({value:NaN,mode:'customer name',quantity:-1}),{currency:'MXN'});
});
test('analytics never sends on localhost or without consent',async()=>{
 let calls=0;globalThis.window={fbq:()=>calls++};globalThis.localStorage={getItem:()=> 'accepted'};globalThis.location={hostname:'localhost',pathname:'/productos',search:''};
 await trackStoreEvent('AddToCart',{id:2});assert.equal(calls,0);
 globalThis.location.hostname='tienda.merlyncilias.com';globalThis.localStorage.getItem=()=> 'rejected';
 await trackStoreEvent('AddToCart',{id:2});assert.equal(calls,0);
 delete globalThis.window;delete globalThis.localStorage;delete globalThis.location;
});
test('analytics waits for initialized pixel, respects feature and deduplicates concurrent events',async()=>{
 const oldFetch=globalThis.fetch;let calls=0;let enabled=true;
 globalThis.window={fbq:()=>calls++,merlynMetaReady:false};globalThis.localStorage={getItem:()=> 'accepted'};globalThis.location={hostname:'tienda.merlyncilias.com',pathname:'/productos',search:''};
 globalThis.fetch=async()=>({ok:true,json:async()=>({metaEventsEnabled:enabled})});
 try{
  await trackStoreEvent('ViewContent',{id:5},'test-view');assert.equal(calls,0);
  window.merlynMetaReady=true;enabled=false;await trackStoreEvent('ViewContent',{id:5},'test-view');assert.equal(calls,0);
  enabled=true;await Promise.all([trackStoreEvent('ViewContent',{id:5},'test-view'),trackStoreEvent('ViewContent',{id:5},'test-view')]);assert.equal(calls,1);
  await trackStoreEvent('ViewContent',{id:5},'test-view');assert.equal(calls,1);
  location.search='?session_id=private';await trackStoreEvent('AddToCart',{id:5});assert.equal(calls,1);
 }finally{globalThis.fetch=oldFetch;delete globalThis.window;delete globalThis.localStorage;delete globalThis.location;}
});
