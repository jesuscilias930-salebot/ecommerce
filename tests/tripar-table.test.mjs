import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
registerHooks({
 resolve(specifier,context,next){
  if(specifier.startsWith('@/'))return next(new URL('../'+specifier.slice(2)+'.ts',import.meta.url).href,context);
  return next(specifier,context);
 },
 load(url,context,next){
  if(url.endsWith('.css'))return {format:'module',source:'export {};',shortCircuit:true};
  if(url.endsWith('.tsx'))return {format:'module',source:ts.transpileModule(readFileSync(new URL(url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText,shortCircuit:true};
  return next(url,context);
 }
});
const {CategoryPricing}=await import('../components/category-pricing.tsx');
const {calculateGroups}=await import('../lib/live-pricing.ts');
const product={id:1,name:'Tin deportivo',category:'Deportivo',categoryId:2,currentStock:1000,rules:[{minQuantity:1,maxQuantity:49,pricePerUnit:9.42},{minQuantity:50,maxQuantity:99,pricePerUnit:8.03},{minQuantity:100,maxQuantity:null,pricePerUnit:7.83}]};
const render=(products,lines=[],incomplete=false)=>renderToStaticMarkup(React.createElement(CategoryPricing,{label:'Deportivos',products,groups:calculateGroups(products,lines),incomplete}));
test('vertical scales show tripar prices, quantity and next discount without a scrolling table',()=>{
 const html=render([product],[{id:-1,quantity:51}]);
 for(const text of ['1 tripar = 3 pares','por tripar','17 tripares','51 pares en total','1–16 tripares','17–33 tripares','34 o más','$28.26','$24.09','$23.49','✓ Tu tarifa actual','Agrega <b>17 tripares</b>'])assert.ok(html.includes(text),text);
 assert.match(html,/<li class="category-price-active">.*?\$24\.09/);
 assert.ok(!html.includes('<table'));assert.ok(!html.includes('overflow'));
 assert.ok(!html.includes('$9.42'));
});
test('independent sports models use a labeled selector rather than parallel columns',()=>{
 const second={...product,id:2,name:'Calceta deportiva',rules:product.rules.map(rule=>({...rule,pricePerUnit:Number(rule.pricePerUnit)+1}))};
 const html=render([product,second],[{id:-1,quantity:51},{id:-2,quantity:3}]);
 assert.ok(html.includes('Consultar precio de'));assert.ok(html.includes('<select'));assert.ok(html.includes('Calceta deportiva'));
 assert.ok(html.includes('otros productos tienen su propia escala'));
 assert.match(html,/<li class="category-price-active">.*?\$24\.09/);
 assert.ok(!html.includes('$31.26')); // The second model cannot overwrite the selected model's rate.
 const caricatura=render([{...product,name:'Calceta caricatura',category:'Caricatura',categoryId:1}]);
 assert.ok(caricatura.includes('1–49 pares'));assert.ok(caricatura.includes('$9.42'));assert.ok(!caricatura.includes('por tripar'));
});
test('unknown packages suppress current rates and discount promises, and empty catalogs render nothing',()=>{
 const html=render([product],[{id:-1,quantity:51}],true);
 assert.ok(html.includes('Por verificar'));assert.ok(!html.includes('category-price-active'));assert.ok(!html.includes('<progress'));assert.ok(!html.includes('mejor tarifa'));
 assert.equal(render([]),'');
});
test('shared-category genders combine and next discount rounds up to complete tripares',()=>{
 const first={...product,name:'Caricatura dama',category:'Caricatura',categoryId:1};
 const second={...first,id:2,name:'Caricatura caballero'};
 const html=render([first,second],[{id:-1,quantity:25},{id:-2,quantity:25}]);
 assert.ok(!html.includes('<select'));assert.ok(html.includes('50 pares'));assert.ok(html.includes('$24.09')===false);assert.ok(html.includes('$8.03'));
 const tripar=render([product],[{id:-1,quantity:48}]);
 assert.ok(tripar.includes('Agrega <b>1 tripar</b>'));assert.ok(tripar.includes('$24.09 por tripar'));
});
test('existing box pair counts are exact even when not divisible by three',()=>{
 const groups=calculateGroups([product],[{id:8,quantity:1}],[{id:8,items:[{productId:1,quantity:50}]}]);
 const html=renderToStaticMarkup(React.createElement(CategoryPricing,{label:'Deportivos',products:[product],groups,incomplete:false}));
 assert.ok(html.includes('<strong>50 pares</strong>'));assert.ok(!html.includes('<strong>16 tripares</strong>'));
 assert.ok(html.includes('$24.09'));assert.ok(html.includes('✓ Tu tarifa actual'));
});
