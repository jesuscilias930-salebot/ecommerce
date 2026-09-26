import type {Original} from './product-catalog';
import type {Package} from './catalog';
import {pricingKey,pricingName} from './live-pricing';
export type CartComponent={productId:number;name:string;categoryKey:string;categoryName:string;quantity:number;perUnitQuantity:number;groupQuantity:number;unitPrice:number;subtotal:number};
export type CartQuoteLine={kind:'PRODUCT'|'BUNDLE';itemId:number;name:string;quantity:number;unitPrice:number;subtotal:number;components:CartComponent[];referenceSubtotal:number|null;savings:number|null};
export type CartQuote={demo?:boolean;lines:CartQuoteLine[];groups:{key:string;name:string;quantity:number;bundlePairs:number;individualPairs:number;subtotal:number}[];totalPairs:number;subtotal:number;savings:number|null};
export type CartInput={products:{productId:number;quantity:number}[];bundles:{bundleId:number;quantity:number}[]};
export const cartInput=(lines:{id:number;quantity:number}[]):CartInput=>({products:lines.filter(l=>l.id<0).map(l=>({productId:-l.id,quantity:l.quantity})),bundles:lines.filter(l=>l.id>0).map(l=>({bundleId:l.id,quantity:l.quantity}))});
export function validCartInput(input:CartInput){
 return input&&Array.isArray(input.products)&&Array.isArray(input.bundles)&&input.products.length+input.bundles.length>0&&input.products.length+input.bundles.length<=200&&input.products.every(p=>p&&Number.isSafeInteger(p.productId)&&p.productId>0&&Number.isInteger(p.quantity)&&p.quantity>0&&p.quantity<=100000)&&input.bundles.every(b=>b&&Number.isSafeInteger(b.bundleId)&&b.bundleId>0&&Number.isInteger(b.quantity)&&b.quantity>0&&b.quantity<=1000);
}
// Only used on the server for mock catalogs; real purchases always use sockControl.
export function demoCartQuote(input:CartInput,products:Original[],packages:Package[]):CartQuote{
 if(!validCartInput(input))throw Error('Cantidades inválidas');
 const articles=[...input.products.map(p=>({kind:'PRODUCT' as const,itemId:p.productId,quantity:p.quantity,name:products.find(v=>v.id===p.productId)?.name||'',items:[{productId:p.productId,quantity:1}]})),...input.bundles.map(b=>{
  const box=packages.find(v=>v.id===b.bundleId);if(!box)throw Error('Caja no disponible');return {kind:'BUNDLE' as const,itemId:b.bundleId,quantity:b.quantity,name:box.name,items:box.items};
 })];
 const demand=new Map<number,number>(),totals=new Map<string,number>();
 for(const a of articles)for(const i of a.items){if(!i.productId||!Number.isInteger(i.quantity)||i.quantity<1)throw Error('Caja incompleta');demand.set(i.productId,(demand.get(i.productId)||0)+i.quantity*a.quantity);}
 for(const [id,n]of demand){const p=products.find(p=>p.id===id);if(!p||n>p.currentStock||n>100000)throw Error('Existencias insuficientes');totals.set(pricingKey(p),(totals.get(pricingKey(p))||0)+n);}
 const rate=(p:Original,n:number)=>{const rules=p.rules.filter(r=>n>=r.minQuantity&&(r.maxQuantity==null||n<=r.maxQuantity));if(rules.length!==1||!Number.isFinite(Number(rules[0].pricePerUnit))||Number(rules[0].pricePerUnit)<0)throw Error('Revisa reglas de precios');return Math.round(Number(rules[0].pricePerUnit)*100)/100;};
 const groups=new Map<string,CartQuote['groups'][number]>();
 const lines=articles.map(a=>{
  const alone=new Map<string,number>();for(const i of a.items){const p=products.find(p=>p.id===i.productId)!;alone.set(pricingKey(p),(alone.get(pricingKey(p))||0)+i.quantity*(a.kind==='PRODUCT'?a.quantity:1));}
  const components=a.items.map(i=>{const p=products.find(p=>p.id===i.productId)!,key=pricingKey(p),quantity=i.quantity*a.quantity,groupQuantity=totals.get(key)!,unitPrice=rate(p,groupQuantity),subtotal=Math.round(unitPrice*100)*quantity/100;
   const group=groups.get(key)||{key,name:pricingName(p),quantity:0,bundlePairs:0,individualPairs:0,subtotal:0};group.quantity+=quantity;group[a.kind==='BUNDLE'?'bundlePairs':'individualPairs']+=quantity;group.subtotal=(Math.round(group.subtotal*100)+Math.round(subtotal*100))/100;groups.set(key,group);
   return {productId:p.id,name:p.name,categoryKey:key,categoryName:pricingName(p),quantity,perUnitQuantity:i.quantity,groupQuantity,unitPrice,subtotal};});
  const unitPrice=components.reduce((n,c)=>n+Math.round(c.unitPrice*100)*c.perUnitQuantity,0)/100,subtotal=Math.round(unitPrice*100)*a.quantity/100;
  let referenceSubtotal:number|null=null;try{referenceSubtotal=components.reduce((n,c)=>n+Math.round(rate(products.find(p=>p.id===c.productId)!,alone.get(c.categoryKey)!)*100)*c.quantity,0)/100;}catch{}
  return {kind:a.kind,itemId:a.itemId,name:a.name,quantity:a.quantity,components,unitPrice,subtotal,referenceSubtotal,savings:referenceSubtotal===null?null:Math.max(0,Math.round((referenceSubtotal-subtotal)*100)/100)};
 });
 return {demo:true,lines,groups:[...groups.values()],totalPairs:[...demand.values()].reduce((a,b)=>a+b,0),subtotal:lines.reduce((n,l)=>n+Math.round(l.subtotal*100),0)/100,savings:lines.every(l=>l.referenceSubtotal!==null)?Math.max(0,lines.reduce((n,l)=>n+Math.round((l.referenceSubtotal!-l.subtotal)*100),0)/100):null};
}
