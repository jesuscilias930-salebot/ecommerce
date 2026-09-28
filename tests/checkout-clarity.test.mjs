import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePhone,validateAddress,emptyAddress} from '../lib/shipping-address.ts';
import {packageQuantityLabel} from '../lib/sale-presentation.ts';
import {packageCategories} from '../lib/package-categories.ts';

test('Mexican phones are normalized without duplicating country prefix',()=>{
 assert.equal(normalizePhone('272 123 4567'),'522721234567');
 assert.equal(normalizePhone('+52 (272) 123-4567'),'522721234567');
 assert.equal(normalizePhone('522721234567'),'522721234567');
 assert.equal(normalizePhone('+1 202 555 0123'),'12025550123');
});
test('checkout submits normalized phones and rejects non-phone text',()=>{
 const address={...emptyAddress,recipient:'Prueba',phone:'272 123 4567',email:'test@example.com',postalCode:'94300',state:'VER',city:'Orizaba',district:'Centro',street:'Prueba',exteriorNumber:'1'};
 assert.equal(validateAddress(address).phone,'522721234567');
 assert.throws(()=>validateAddress({...address,phone:'abcdefg'}));
});
test('package labels distinguish sports sets, other socks and mixed apparel',()=>{
 assert.equal(packageQuantityLabel({pieces:150,items:[{name:'Tin deportivo',quantity:150}]}),'150 pares · 50 tripares');
 assert.equal(packageQuantityLabel({pieces:50,items:[{name:'Calceta caricatura',quantity:50}]}),'50 pares');
 assert.equal(packageQuantityLabel({pieces:70,items:[{name:'Short deportivo',quantity:10},{name:'Tin deportivo',quantity:60}]}),'70 unidades');
});
test('missing package categories use actual content without overriding configured names',()=>{
 const item={id:1,items:[{category:'CARICATURA'}]};
 assert.equal(packageCategories([item])[0].name,'CARICATURA');
 assert.equal(packageCategories([{...item,storeCategory:'Favoritos'}])[0].name,'Favoritos');
 assert.equal(packageCategories([{id:2,items:[{category:'LICRA'},{category:'DEPORTIVAS'}]}])[0].name,'Paquetes surtidos');
});
