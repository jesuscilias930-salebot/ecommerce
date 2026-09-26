import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateGroups, pricingKey, pricingName} from '../lib/live-pricing.ts';
import {groupByCategory} from '../lib/product-categories.ts';

const product=(id,categoryId=1,price=10)=>({id,name:`Modelo ${id}`,categoryId,category:'Caricatura',currentStock:1000,rules:[{minQuantity:1,maxQuantity:49,pricePerUnit:price},{minQuantity:50,maxQuantity:null,pricePerUnit:price-2}]});
test('25 dama + 25 caballero use 50 pairs and each model retains its own tariff',()=>{
 const products=[product(1),product(2,1,12)];
 const [group]=calculateGroups(products,[{id:-1,quantity:25},{id:-2,quantity:25}]);
 assert.equal(group.quantity,50);assert.equal(group.name,'Caricatura');
 assert.deepEqual(group.rows.map(r=>r.price),[8,10]);assert.equal(group.total,450);
 const [reduced]=calculateGroups(products,[{id:-1,quantity:25},{id:-2,quantity:24}]);
 assert.deepEqual(reduced.rows.map(r=>r.price),[10,12]);assert.equal(reduced.quantity,49);
});
test('distinct category IDs remain separate even with identical names or legacy groups',()=>{
 const products=[{...product(1),pricingGroup:'shared'},{...product(2,2),pricingGroup:'shared'}];
 const groups=calculateGroups(products,[{id:-1,quantity:25},{id:-2,quantity:25},{id:99,quantity:100}]);
 assert.equal(groups.length,2);groups.forEach(g=>{assert.equal(g.quantity,25);assert.equal(g.total,250);});
 assert.equal(groupByCategory(products).length,2);
});
test('uncategorized products never combine; old payloads retain legacy compatibility',()=>{
 const first={...product(1,null),pricingGroup:'shared'},second={...product(2,null),pricingGroup:'shared'};
 assert.notEqual(pricingKey(first),pricingKey(second));assert.equal(pricingName(first),first.name);
 delete first.categoryId;delete second.categoryId;assert.equal(pricingKey(first),pricingKey(second));
});
test('missing rules or stock are not shown as confirmed savings',()=>{
 const products=[product(1),{...product(2),rules:[]}];
 assert.equal(calculateGroups(products,[{id:-1,quantity:25},{id:-2,quantity:25}])[0].total,null);
 assert.equal(calculateGroups([product(1)],[{id:-1,quantity:1001}])[0].total,null);
});
test('category count uses all cart variants, not only a visible search result; unknown boxes cannot be expanded',()=>{
 const products=[product(1),product(2)];
 const visible=products.filter(p=>p.id===1);
 const group=calculateGroups(products,[{id:-1,quantity:25},{id:-2,quantity:25},{id:8,quantity:10}]).find(g=>g.key===pricingKey(visible[0]));
 assert.equal(group.quantity,50);
});
test('box contents combine with loose pairs across genders and remain isolated by category',()=>{
 const products=[product(1),product(2),product(3,2,20)];
 const boxes=[{id:8,items:[{productId:1,quantity:25},{productId:3,quantity:10}]}];
 const groups=calculateGroups(products,[{id:8,quantity:2},{id:-2,quantity:25}],boxes);
 const caricatura=groups.find(g=>g.key==='category:1');
 assert.equal(caricatura.quantity,75);
 assert.equal(caricatura.rows[0].price,8);
 assert.equal(groups.find(g=>g.key==='category:2').quantity,20);
});
test('combined box and loose demand cannot exceed product stock',()=>{
 const boxes=[{id:8,items:[{productId:1,quantity:600}]}];
 const [group]=calculateGroups([product(1)],[{id:8,quantity:1},{id:-1,quantity:401}],boxes);
 assert.equal(group.quantity,1001);
 assert.equal(group.rows[0].price,null);
});
