import test from 'node:test';
import assert from 'node:assert/strict';
import {packageCategories} from '../lib/package-categories.ts';
import {pricingKey,calculateGroups} from '../lib/live-pricing.ts';
test('package categories keep all boxes on one page and preserve order',()=>{
 const list=[{id:1,storeCategory:'Deportivos'},{id:2,storeCategory:'Paquetes surtidos'},{id:3,storeCategory:'Deportivos'},{id:4}];
 const groups=packageCategories(list);
 assert.deepEqual(groups.map(g=>g.name),['Deportivos','Paquetes surtidos','Otros paquetes']);
 assert.deepEqual(groups[0].items.map(p=>p.id),[1,3]);
 assert.deepEqual(packageCategories([]),[]);
});
test('only male shorts share quantity, including boxes',()=>{
 const make=(id,gender)=>({id,name:'Short deportivo',gender,category:'Deportivos',categoryId:1,currentStock:100,rules:[{minQuantity:1,maxQuantity:10,pricePerUnit:gender==='Hombre'?99:104},{minQuantity:11,maxQuantity:null,pricePerUnit:gender==='Hombre'?98:103}]});
 const male1=make(1,'Hombre'),male2=make(2,'Hombre'),female=make(3,'Mujer');
 assert.equal(pricingKey(male1),pricingKey(male2));assert.notEqual(pricingKey(male1),pricingKey(female));
 const groups=calculateGroups([male1,male2,female],[{id:-1,quantity:10},{id:-3,quantity:10},{id:8,quantity:1}],[{id:8,items:[{productId:2,quantity:10}]}]);
 assert.equal(groups.find(g=>g.key==='shorts:caballero').quantity,20);
 assert.equal(groups.find(g=>g.key==='shorts:caballero').rows[0].price,98);
 assert.equal(groups.find(g=>g.key==='product:3').rows[0].price,104);
});
test('assorted boxes still count when their anchor is sold out and absent from product cards',()=>{
 const p={id:2,name:'Caricatura dama',category:'Caricatura',categoryId:1,currentStock:100,rules:[{minQuantity:1,maxQuantity:49,pricePerUnit:10},{minQuantity:50,maxQuantity:null,pricePerUnit:8}]};
 const boxes=[{id:8,items:[{productId:1,categoryId:1,assorted:true,quantity:40}]}];
 const [group]=calculateGroups([p],[{id:8,quantity:1},{id:-2,quantity:10}],boxes);
 assert.equal(group.quantity,50);assert.equal(group.rows[0].price,8);
 assert.equal(calculateGroups([{...p,currentStock:49}],[{id:8,quantity:1},{id:-2,quantity:10}],boxes)[0].rows[0].price,null);
});
