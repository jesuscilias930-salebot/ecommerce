import test from 'node:test';
import assert from 'node:assert/strict';
import {isAllowedStoreOrigin} from '../lib/store-origin.mjs';

const host='tienda.merlyncilias.com';
const config=JSON.stringify({[host]:'Merlyn_494df','ecommerce-9w7o.onrender.com':'Merlyn_494df','another.example':'other'});
function request(origin=`https://${host}`,target=host,extra={},path='/api/shipping-quote') {
  return new Request(`http://localhost:10000${path}`,{method:'POST',headers:{...(origin===null?{}:{origin}),...(target===null?{}:{host:target}),...extra}});
}
for(const path of ['/api/shipping-quote','/api/orders']) {
 test(`${path}: accepts public HTTPS despite internal Render URL`,()=>assert.equal(isAllowedStoreOrigin(request(undefined,undefined,{'sec-fetch-site':'same-origin'},path),config),true));
}
test('accepts configured Render hostname',()=>assert.equal(isAllowedStoreOrigin(request('https://ecommerce-9w7o.onrender.com','ecommerce-9w7o.onrender.com'),config),true));
test('rejects missing, opaque, malformed and noncanonical origins',()=>{
 for(const origin of [null,'null','broken',`https://${host}/`,`https://${host}/path`,`https://user@${host}`,`https://${host}?x=1`,`https://${host}, https://evil.example`])assert.equal(isAllowedStoreOrigin(request(origin),config),false,`${origin}`);
});
test('rejects HTTP in production',()=>assert.equal(isAllowedStoreOrigin(request(`http://${host}`),config),false));
test('rejects other configured stores and alternate hostnames as origins',()=>{
 for(const origin of ['https://another.example','https://ecommerce-9w7o.onrender.com',`https://${host}.evil.example`,`https://${host}:444`])assert.equal(isAllowedStoreOrigin(request(origin),config),false);
});
test('rejects unconfigured Host even when Origin matches',()=>assert.equal(isAllowedStoreOrigin(request('https://evil.example','evil.example'),config),false));
test('forwarded headers cannot authorize a request',()=>assert.equal(isAllowedStoreOrigin(request(undefined,'internal:10000',{'x-forwarded-host':host,'x-forwarded-proto':'https'}),config),false));
test('rejects malformed or absent allowlist in production',()=>{
 for(const value of [undefined,'{}','null','invalid'])assert.equal(isAllowedStoreOrigin(request(),value),false);
 assert.equal(isAllowedStoreOrigin(request(undefined,null),config),false);
});
test('rejects explicit cross-site fetch metadata',()=>assert.equal(isAllowedStoreOrigin(request(undefined,undefined,{'sec-fetch-site':'cross-site'}),config),false));
test('development allows exact local host and port only',()=>{
 assert.equal(isAllowedStoreOrigin(request('http://localhost:3000','localhost:3000'),undefined,true),true);
 assert.equal(isAllowedStoreOrigin(request('http://localhost:3001','localhost:3000'),undefined,true),false);
 assert.equal(isAllowedStoreOrigin(request('http://localhost:3000','localhost:3000'),undefined,false),false);
});
