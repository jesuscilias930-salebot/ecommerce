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
