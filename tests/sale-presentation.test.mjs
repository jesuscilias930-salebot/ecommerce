import test from 'node:test';
import assert from 'node:assert/strict';
import { usesTripares, triparesLabel, bundlePresentation,packageCardContents,salePackSize,saleUnitPrice,saleQuantityLabel,saleTierBoundaries,saleUnit,saleUnits } from '../lib/sale-presentation.ts';
import {calculateGroups} from '../lib/live-pricing.ts';

test('tripar prices multiply the existing pair tariff without changing the stored rules',()=>{
 for(const [name,price,total] of [['Tin deportivo',9.42,28.26],['Calceta deportiva',10.97,32.91],['Tin de licra',11.68,35.04]]){
  const item={name};assert.equal(salePackSize(item),3);assert.equal(saleUnit(item),'tripar');assert.equal(saleUnits(item),'tripares');assert.equal(saleUnitPrice(price,item),total);
  assert.equal(saleQuantityLabel(3,item),'1 tripar (3 pares)');
  assert.equal(saleQuantityLabel(6,item),'2 tripares (6 pares)');
 }
 assert.equal(saleUnitPrice(8.125,{name:'Tin deportivo'}),24.39);
 assert.equal(saleUnitPrice(8.93,{name:'Calceta caricatura'}),8.93);
 assert.equal(salePackSize({name:'Short deportivo'}),1);
});
test('pair thresholds become nonoverlapping whole-tripar ranges',()=>{
 const starts=[1,50,100,200,300,500,1000,2000];
 assert.deepEqual(saleTierBoundaries(starts,3),[1,17,34,67,100,167,334,667]);
 assert.deepEqual(saleTierBoundaries([1,2,3,4,50,50],3),[1,2,17]);
 assert.deepEqual(saleTierBoundaries(starts,1),starts);
});
test('tripares keep pair-based stock, totals and independent product pricing, including boxes',()=>{
 const products=['Tin deportivo','Calceta deportiva','Tin de licra'].map((name,index)=>({id:index+1,name,category:'Deportivas',categoryId:1,currentStock:100,rules:[{minQuantity:1,maxQuantity:49,pricePerUnit:10},{minQuantity:50,maxQuantity:99,pricePerUnit:8},{minQuantity:100,maxQuantity:null,pricePerUnit:7}]}));
 for(const [sets,price] of [[16,10],[17,8],[33,8],[34,null]]){
  const group=calculateGroups(products,[{id:-1,quantity:sets*salePackSize(products[0])}])[0];
  assert.equal(group.quantity,sets*3);assert.equal(group.rows[0].price,price);
  if(price!==null)assert.equal(group.total,sets*saleUnitPrice(price,products[0]));
 }
 const groups=calculateGroups(products,[{id:-1,quantity:3},{id:-2,quantity:3},{id:8,quantity:1}],[{id:8,items:[{productId:1,quantity:48}]}]);
 assert.equal(groups.find(g=>g.key==='product:1').rows[0].price,8);
 assert.equal(groups.find(g=>g.key==='product:2').rows[0].price,10);
 assert.equal(saleQuantityLabel(4,products[0]),'1 tripar + 1 par suelto (4 pares)');
});

test('cards describe assorted slots by category and keep fixed products distinct',()=>{
 const rows=packageCardContents([{name:'Referencia dama',category:'Caricatura',categoryId:1,quantity:25,assorted:true},{name:'Referencia niño',category:'Caricatura',categoryId:1,quantity:25,assorted:true},{name:'Tin deportivo',quantity:60},{name:'Short dama',quantity:10}]);
 assert.equal(rows.length,3);
 assert.deepEqual(rows[0],{name:'Caricatura',quantity:50,pieces:false,tripares:false});
 assert.equal(rows[1].name,'Tin deportivo');assert.equal(rows[1].tripares,true);
 assert.equal(rows[2].pieces,true);
});

test('solo las familias vendidas en tripares usan la equivalencia', () => {
  for (const name of ['Tin deportivo', 'CALCETA DEPORTIVA', 'Tin de licra', 'Tin afelpado']) assert.equal(usesTripares({name}), true);
  assert.equal(usesTripares({name:'TIN', category:'DEPORTIVAS'}), true);
  for (const name of ['Calceta caricatura', 'Tin económico', 'Short deportivo']) assert.equal(usesTripares({name}), false);
});
test('150 pares equivalen a 50 tripares y dos cajas a 100', () => {
  assert.equal(triparesLabel(150), '50 tripares');
  assert.equal(triparesLabel(300), '100 tripares');
  assert.equal(triparesLabel(3), '1 tripar');
  assert.equal(triparesLabel(151), '50 tripares + 1 par suelto');
});
test('totales mixtos no convierten shorts ni caricatura en tripares', () => {
  assert.equal(bundlePresentation([{quantity:150,tripares:true},{quantity:150,tripares:true}]), '100 tripares');
  assert.equal(bundlePresentation([{quantity:150,tripares:true},{quantity:10,tripares:false}]), null);
  assert.equal(bundlePresentation([{quantity:4,tripares:true},{quantity:5,tripares:true}]), '2 tripares + 3 pares sueltos');
  assert.equal(bundlePresentation([]), null);
});
