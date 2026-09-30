import test from 'node:test';
import assert from 'node:assert/strict';
import {packageFilter} from '../lib/package-categories.ts';
const box=(storeCategory,categories)=>({storeCategory,items:categories.map(category=>({category}))});
test('package filters respect the assigned category',()=>{
 assert.equal(packageFilter(box('Paquetes surtidos',['Caricatura'])),'surtido');
 assert.equal(packageFilter(box('Deportivos',['Deportivas','Licra'])),'deportivo');
 assert.equal(packageFilter(box('Caricatura',['Caricatura'])),'caricatura');
});
test('legacy packages without a category use their contents',()=>{
 assert.equal(packageFilter(box(null,['Caricatura','Caricatura'])),'caricatura');
 assert.equal(packageFilter(box('', ['Deportivas','Licra'])),'deportivo');
 assert.equal(packageFilter(box(null,['Caricatura','Deportivas'])),'surtido');
 assert.equal(packageFilter(box(null,[])),'all');
});
