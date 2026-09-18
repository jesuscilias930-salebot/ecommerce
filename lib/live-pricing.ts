import type {Original} from './product-catalog';
export const pricingKey=(p:Original)=>p.pricingGroup?.trim()?`group:${p.pricingGroup.trim().toLowerCase()}`:`product:${p.id}`;
export function calculateGroups(products:Original[],lines:{id:number;quantity:number}[]) {
 const selected=lines.filter(l=>l.id<0).map(l=>({quantity:l.quantity,product:products.find(p=>p.id===-l.id),id:l.id}));
 const keys=[...new Set(selected.map(l=>l.product?pricingKey(l.product):`missing:${l.id}`))];
 return keys.map(key=>{
  const members=selected.filter(l=>(l.product?pricingKey(l.product):`missing:${l.id}`)===key);
  const quantity=members.reduce((s,l)=>s+l.quantity,0);
  const rows=members.map(l=>{
   const matches=l.product?.rules.filter(r=>quantity>=r.minQuantity&&(r.maxQuantity==null||quantity<=r.maxQuantity))||[];
   const price=matches.length===1?Number(matches[0].pricePerUnit):NaN;
   const valid=Number.isFinite(price)&&price>=0&&!!l.product&&l.quantity<=l.product.currentStock;
   return {...l,price:valid?price:null,total:valid?Math.round(price*100)*l.quantity/100:null};
  });
  const total=rows.every(l=>l.total!==null)?rows.reduce((s,l)=>s+Math.round(l.total!*100),0)/100:null;
  const next=rows.flatMap(l=>l.product?.rules.filter(r=>r.minQuantity>quantity&&l.price!==null&&Number(r.pricePerUnit)<l.price).map(r=>r.minQuantity)||[]).sort((a,b)=>a-b)[0];
  return {key,name:members[0].product?.pricingGroup||members[0].product?.name||'Producto no disponible',quantity,rows,total,next};
 });
}
