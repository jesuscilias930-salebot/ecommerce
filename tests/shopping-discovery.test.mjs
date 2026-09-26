import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesSearch, relatedPackages } from '../lib/shopping-discovery.ts';

const bundle=(id,price,productIds,available=4)=>({id,name:`Caja ${id}`,price,available,pieces:60,tone:0,items:productIds.map(productId=>({productId,name:'Calceta',quantity:20}))});
test('search ignores accents, case and word order',()=>{
 assert.ok(matchesSearch('Calcetín CARICATURA para dama','dama calcetin'));
 assert.ok(matchesSearch('Deportivo unisex','  UNISEX   deportivo '));
 assert.ok(matchesSearch('Paquete inicial',''));
 assert.equal(matchesSearch('Deportivo unisex','caricatura'),false);
});
test('related packages prioritize shared contents then nearby investment',()=>{
 const current=bundle(1,500,[10,20]);
 const items=[current,bundle(2,510,[30]),bundle(3,900,[10]),bundle(4,700,[10,20]),bundle(5,600,[10])];
 assert.deepEqual(relatedPackages(current,items).map(p=>p.id),[4,5,3]);
 assert.deepEqual(items.map(p=>p.id),[1,2,3,4,5]);
});
test('never recommends current or unavailable package',()=>{
 const current=bundle(1,500,[10]);
 assert.deepEqual(relatedPackages(current,[current,bundle(2,510,[10],0)]),[]);
 assert.deepEqual(relatedPackages(current,[bundle(3,700,[20]),bundle(4,600,[20])]).map(p=>p.id),[4,3]);
 assert.deepEqual(relatedPackages(current,[bundle(2,500,[10])],0),[]);
});
