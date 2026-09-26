import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveMetaTestMode,hasMetaTestCookie,allowsMetaAttribution,isMetaTestMode} from '../lib/meta-test-mode.mjs';
import {checkoutAttribution,MARKETING_CONSENT_KEY} from '../lib/meta-attribution.ts';

test('explicit query enables/disables; navigation preserves the mode; conflicts suppress tracking',()=>{
 assert.equal(resolveMetaTestMode('?meta_test=1'),true);
 assert.equal(resolveMetaTestMode('?other=1',true),true);
 assert.equal(resolveMetaTestMode('?meta_test=0',true),false);
 assert.equal(resolveMetaTestMode('?meta_test=0&meta_test=1'),true);
 assert.equal(resolveMetaTestMode('?meta_test=unexpected'),false);
 assert.equal(resolveMetaTestMode('?meta_test=unexpected',true),true);
});
test('server rejects attribution for test cookies or checkout marker, even with consent',()=>{
 assert.ok(hasMetaTestCookie('x=1; merlyn_meta_test=1; other=2'));
 assert.equal(hasMetaTestCookie('not_merlyn_meta_test=1'),false);
 assert.equal(hasMetaTestCookie('merlyn_meta_test=10'),false);
 assert.equal(allowsMetaAttribution('merlyn_meta_test=1',{consent:true}),false);
 assert.equal(allowsMetaAttribution('',{consent:true,testMode:true}),false);
 assert.equal(allowsMetaAttribution('',{consent:false}),false);
 assert.equal(allowsMetaAttribution('',undefined),false);
 assert.equal(allowsMetaAttribution('',{consent:true}),true);
});
test('checkout stays suppressed across navigation and Stripe return despite previously accepted ads',()=>{
 const storage=new Map(),jar=new Map([['_fbp','fb.1.1720000000000.123']]);
 const original={window:globalThis.window,document:globalThis.document,sessionStorage:globalThis.sessionStorage,localStorage:globalThis.localStorage};
 globalThis.window={location:{search:'?meta_test=1',protocol:'https:',hostname:'tienda.merlyncilias.com'}};
 globalThis.document={get cookie(){return [...jar].map(([k,v])=>`${k}=${v}`).join('; ');},set cookie(value){const [kv]=value.split(';'),[key,val]=kv.split('=');if(value.includes('Max-Age=0'))jar.delete(key);else jar.set(key,val);}};
 globalThis.sessionStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
 globalThis.localStorage={getItem:k=>k===MARKETING_CONSENT_KEY?'accepted':null};
 try{
  assert.equal(isMetaTestMode(),true);
  assert.deepEqual(checkoutAttribution(),{consent:false,testMode:true});
  window.location.search='';assert.equal(isMetaTestMode(),true);
  window.location.search='?session_id=cs_test_example';assert.deepEqual(checkoutAttribution(),{consent:false,testMode:true});
  // Cookie and storage failures cannot reactivate tracking within this page session.
  globalThis.sessionStorage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}};
  assert.equal(isMetaTestMode(),true);
  globalThis.sessionStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
  window.location.search='?meta_test=0';assert.equal(isMetaTestMode(),false);
  assert.equal(jar.has('merlyn_meta_test'),false);assert.equal(storage.size,0);
  assert.equal(checkoutAttribution().consent,true);
 }finally{for(const [key,value] of Object.entries(original)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});
