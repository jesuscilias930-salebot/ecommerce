import type {Package} from './catalog';
import type {Original} from './product-catalog';
export const hasCategoryVolume=(p:Original)=>Number.isInteger(p.categoryId)&&p.categoryId!=null;
// An absent field indicates an older backend during a rolling deployment.
// Explicit null means no category: never combine unrelated uncategorized products.
export const pricingKey=(p:Original)=>hasCategoryVolume(p)?`category:${p.categoryId}`:p.categoryId===undefined&&p.pricingGroup?.trim()?`group:${p.pricingGroup.trim().toLowerCase()}`:`product:${p.id}`;
export const pricingName=(p:Original)=>hasCategoryVolume(p)?p.category||'Categoría':p.categoryId===undefined&&p.pricingGroup?.trim()||p.name;
export function calculateGroups(products:Original[],lines:{id:number;quantity:number}[],packages:Package[]=[]) {
 const boxed=lines.filter(l=>l.id>0).flatMap(l=>(packages.find(p=>p.id===l.id)?.items||[]).map(i=>({id:-(i.productId||0),quantity:i.quantity*l.quantity,product:products.find(p=>p.id===i.productId)})));
 const productDemand=(id:number)=>lines.filter(l=>l.id===id).reduce((n,l)=>n+l.quantity,0)+boxed.filter(l=>l.id===id).reduce((n,l)=>n+l.quantity,0);
 const selected=lines.filter(l=>l.id<0).map(l=>({quantity:l.quantity,product:products.find(p=>p.id===-l.id),id:l.id}));
 const keys=[...new Set([...selected,...boxed].map(l=>l.product?pricingKey(l.product):`missing:${l.id}`))];
 return keys.map(key=>{
  const members=selected.filter(l=>(l.product?pricingKey(l.product):`missing:${l.id}`)===key);
  const boxMembers=boxed.filter(l=>(l.product?pricingKey(l.product):`missing:${l.id}`)===key);
  const quantity=[...members,...boxMembers].reduce((s,l)=>s+l.quantity,0);
  const rows=members.map(l=>{
   const matches=l.product?.rules.filter(r=>quantity>=r.minQuantity&&(r.maxQuantity==null||quantity<=r.maxQuantity))||[];
   const price=matches.length===1?Number(matches[0].pricePerUnit):NaN;
   const valid=Number.isFinite(price)&&price>=0&&!!l.product&&productDemand(l.id)<=l.product.currentStock;
   return {...l,price:valid?price:null,total:valid?Math.round(price*100)*l.quantity/100:null};
  });
  const total=rows.every(l=>l.total!==null)?rows.reduce((s,l)=>s+Math.round(l.total!*100),0)/100:null;
  const next=rows.flatMap(l=>l.product?.rules.filter(r=>r.minQuantity>quantity&&l.price!==null&&Number(r.pricePerUnit)<l.price).map(r=>r.minQuantity)||[]).sort((a,b)=>a-b)[0];
  return {key,name:(members[0]||boxMembers[0]).product?pricingName((members[0]||boxMembers[0]).product!):'Producto no disponible',quantity,rows,total,next};
 });
}
