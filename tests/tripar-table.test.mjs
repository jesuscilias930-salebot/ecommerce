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
const render=(products,lines=[])=>renderToStaticMarkup(React.createElement(CategoryPricing,{label:'Deportivos',products,groups:calculateGroups(products,lines),incomplete:false}));
test('rendered table clearly sells three pairs and shows tripar prices and ranges',()=>{
 const html=render([product],[{id:-1,quantity:51}]);
 for(const text of ['Cada tripar contiene 3 pares','por tripar','17 tripares (51 pares)','1–16 tripares','17–33 tripares','34 o más','$28.26','$24.09','$23.49','✓ Tu tarifa actual'])assert.ok(html.includes(text),text);
 assert.match(html,/<td class="category-price-active">\$24\.09/);
 assert.ok(!html.includes('$9.42'));
});
test('sports columns retain independent prices and pair-based categories do not convert',()=>{
 const second={...product,id:2,name:'Calceta deportiva',rules:product.rules.map(rule=>({...rule,pricePerUnit:Number(rule.pricePerUnit)+1}))};
 const html=render([product,second],[{id:-1,quantity:51},{id:-2,quantity:3}]);
 assert.ok(html.includes('escalas independientes'));
 assert.match(html,/<td class="category-price-active">\$31\.26/);
 assert.match(html,/<td class="category-price-active">\$24\.09/);
 const caricatura=render([{...product,name:'Calceta caricatura',category:'Caricatura',categoryId:1}]);
 assert.ok(caricatura.includes('1–49 pares'));assert.ok(caricatura.includes('$9.42'));assert.ok(!caricatura.includes('por tripar'));
});
