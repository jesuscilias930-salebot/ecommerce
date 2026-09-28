import test from 'node:test';
import assert from 'node:assert/strict';
import {volumePricingMessage,bundleVolumeMessages} from '../lib/live-pricing.ts';

const product=(values)=>({id:1,name:'CALCETA',category:'CARICATURA',categoryId:2,currentStock:100,rules:[],...values});
test('category message mentions only the applicable category and no guaranteed lowest tier',()=>{
 const text=volumePricingMessage(product({gender:'Mujer'}));
 assert.match(text,/categoría caricatura/);
 assert.match(text,/sin importar el género/);
 assert.doesNotMatch(text,/deport|licra|short|más bajo/i);
});
test('sports, lycra and unclassified products use their own quantity',()=>{
 for(const category of ['DEPORTIVAS','LICRA',null]){
  const text=volumePricingMessage(product({name:'Tin',category,categoryId:category?2:null}));
  assert.match(text,/total de este producto/);
  assert.doesNotMatch(text,/sin importar el género/);
 }
});
test('male shorts combine without unrelated female explanation',()=>{
 const text=volumePricingMessage(product({name:'Short',gender:'Hombre'}));
 assert.match(text,/con y sin cierre/);
 assert.doesNotMatch(text,/dama/i);
 assert.match(volumePricingMessage(product({name:'Short dama',gender:'Mujer'})),/total de este producto/);
});
test('bundle messages deduplicate categories and use only included products',()=>{
 const items=[{productId:1,name:'Calceta dama',category:'CARICATURA',categoryId:2},{productId:2,name:'Calceta caballero',category:'CARICATURA',categoryId:2}];
 assert.equal(bundleVolumeMessages({items}).length,1);
 const mixed=bundleVolumeMessages({items:[...items,{productId:3,name:'Tin deportivo',category:'DEPORTIVAS',categoryId:3}]});
 assert.equal(mixed.length,2);
 assert.match(mixed[1],/tin deportivo/);
 assert.doesNotMatch(mixed.join(' '),/shorts|licra/i);
});
test('several sports products share one explanation without combining their prices',()=>{
 const items=[{productId:1,name:'Tin deportivo',category:'DEPORTIVAS'},{productId:2,name:'Calceta deportiva unisex',category:'DEPORTIVAS'},{productId:3,name:'Tin de licra',category:'LICRA'}];
 const messages=bundleVolumeMessages({items});
 assert.equal(messages.length,1);
 assert.match(messages[0],/Cada producto se calcula por separado/);
 assert.match(messages[0],/mismo producto/);
});
test('repeated rows for the same product display its explanation only once',()=>{
 const item={productId:1,name:'Calceta deportiva unisex',category:'DEPORTIVAS'};
 const messages=bundleVolumeMessages({items:[item,{...item,name:'CALCETA  DEPORTIVA UNISEX'}]});
 assert.equal(messages.length,1);
 assert.match(messages[0],/calceta deportiva unisex/);
});
test('mixed bundles keep category and individual rules distinct',()=>{
 const messages=bundleVolumeMessages({items:[{productId:1,name:'Tin deportivo',category:'DEPORTIVAS'},{productId:2,name:'Calceta deportiva',category:'DEPORTIVAS'},{productId:3,name:'Calceta caricatura',category:'CARICATURA',categoryId:7}]});
 assert.equal(messages.length,2);
 assert.match(messages[0],/por separado/);
 assert.match(messages[1],/categoría caricatura/);
});
