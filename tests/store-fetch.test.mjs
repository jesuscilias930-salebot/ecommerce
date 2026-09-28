import test from 'node:test';
import assert from 'node:assert/strict';
import {storeFetch} from '../lib/store-fetch.ts';

test('logs safe diagnostics and does not retry or consume the upstream body',async t=>{
 const logs=[];t.mock.method(console,'warn',(...args)=>logs.push(args));
 const response=new Response('private payload',{status:429,headers:{'X-Store-Error-Code':'STORE_RATE_LIMITED','X-Store-Request-Id':'12345678-1234-1234-1234-123456789abc'}});
 const mock=t.mock.method(globalThis,'fetch',async()=>response);
 assert.equal(await storeFetch('https://private.example/path?secret=x','/public/store/bundles?budget=all',{headers:{Authorization:'secret'}}),response);
 assert.equal(response.bodyUsed,false);assert.equal(mock.mock.callCount(),1);
 assert.equal(logs[0][1].status,429);assert.equal(logs[0][1].code,'STORE_RATE_LIMITED');
 assert.equal(logs[0][1].endpoint,'/public/store/bundles');
 assert.doesNotMatch(JSON.stringify(logs),/secret|private|budget/);
});
test('distinguishes timeouts without logging exception details',async t=>{
 const logs=[];t.mock.method(console,'warn',(...args)=>logs.push(args));
 t.mock.method(globalThis,'fetch',async()=>{throw new DOMException('sensitive details','TimeoutError');});
 await assert.rejects(storeFetch('https://private.example','/public/store/price-rules',{}));
 assert.equal(logs[0][1].reason,'timeout');assert.doesNotMatch(JSON.stringify(logs),/sensitive|private/);
});
test('successful calls produce no error logs',async t=>{
 const log=t.mock.method(console,'warn',()=>{});t.mock.method(globalThis,'fetch',async()=>new Response('{}'));
 assert.equal((await storeFetch('https://example.com','/public/store/bundles',{})).status,200);
 assert.equal(log.mock.callCount(),0);
});
