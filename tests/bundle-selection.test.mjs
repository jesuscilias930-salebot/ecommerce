import test from 'node:test';
import assert from 'node:assert/strict';
import {customizable,cleanSelection,validSelection,bundleInput,selectionKey} from '../lib/bundle-selection.ts';
import {calculateGroups} from '../lib/live-pricing.ts';

test('only fully assorted caricatura packages can be customized',()=>{
 const part={assorted:true,categoryId:1,category:'Caricatura'};
 assert.equal(customizable({items:[part]}),true);
 for(const items of [[],[{...part,assorted:false}],[part,{...part,categoryId:2}],[{...part,category:'Deportivos'}]])assert.equal(customizable({items}),false);
});
test('selection rejects duplicates, invalid quantities and unbounded input',()=>{
 for(const value of [null,[],[{productId:1,quantity:0}],[{productId:1,quantity:1.5}],[{productId:-1,quantity:20}],[{productId:1,quantity:10},{productId:1,quantity:40}],Array.from({length:201},(_,i)=>({productId:i+1,quantity:1}))]){
  assert.equal(validSelection(value),false);assert.throws(()=>cleanSelection(value));
 }
 assert.equal(validSelection(undefined),true);
});
test('API payload keeps only ids/quantities and canonicalizes order for shipping and payment',()=>{
 const selection=[{productId:2,quantity:30,price:0},{productId:1,quantity:20}];
 assert.deepEqual(bundleInput({bundleId:10,quantity:2,selection}),{bundleId:10,quantity:2,selection:[{productId:1,quantity:20},{productId:2,quantity:30}]});
 assert.equal(selectionKey(selection),selectionKey([...selection].reverse()));
 assert.notEqual(selectionKey(selection),selectionKey([{productId:1,quantity:50}]));
 assert.deepEqual(bundleInput({bundleId:10,quantity:1}),{bundleId:10,quantity:1});
});
test('client volume hints use selected variants and combine their stock with loose pairs',()=>{
 const product=id=>({id,name:`Variante ${id}`,category:'Caricatura',categoryId:1,currentStock:100,rules:[{minQuantity:1,maxQuantity:null,pricePerUnit:8.93}]});
 const packages=[{id:10,items:[{productId:1,quantity:50,assorted:true,categoryId:1}]}];
 const [group]=calculateGroups([product(1),product(2)],[{id:-2,quantity:50},{id:10,quantity:2,selection:[{productId:2,quantity:50}]}],packages);
 assert.equal(group.quantity,150);assert.equal(group.rows[0].total,null);
});
