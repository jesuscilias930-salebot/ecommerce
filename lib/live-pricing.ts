import type {Package} from './catalog';
import type {Original} from './product-catalog';
export const individualVolume=(p:Original)=>/deport|licra/.test((p.category||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase());
export const shortProduct=(p:Original)=>/\bshorts?\b/i.test(p.name+' '+(p.category||''));
const maleShort=(p:Original)=>shortProduct(p)&&/^(hombre|caballero)$/i.test(p.gender||'');
export const hasCategoryVolume=(p:Original)=>!shortProduct(p)&&!individualVolume(p)&&Number.isInteger(p.categoryId)&&p.categoryId!=null;
// An absent field indicates an older backend during a rolling deployment.
// Explicit null means no category: never combine unrelated uncategorized products.
export const pricingKey=(p:Original)=>maleShort(p)?'shorts:caballero':shortProduct(p)||individualVolume(p)?`product:${p.id}`:hasCategoryVolume(p)?`category:${p.categoryId}`:p.categoryId===undefined&&p.pricingGroup?.trim()?`group:${p.pricingGroup.trim().toLowerCase()}`:`product:${p.id}`;
export const pricingName=(p:Original)=>maleShort(p)?'Shorts caballero':shortProduct(p)||individualVolume(p)?p.name:hasCategoryVolume(p)?p.category||'Categoría':p.categoryId===undefined&&p.pricingGroup?.trim()||p.name;
export function volumePricingMessage(p:Original):string {
 const key=pricingKey(p);
 if(key==='shorts:caballero')return 'Suma shorts de caballero con y sin cierre, en paquetes o por separado. La cantidad total determina el precio de mayoreo de cada modelo.';
 if(key.startsWith('category:')||key.startsWith('group:'))return `Todos los pares de la categoría ${pricingName(p).toLocaleLowerCase('es-MX')} se suman en tu carrito, sin importar el género. Incluimos los de tus paquetes y los individuales para aplicar a cada modelo el precio de mayoreo que corresponde al total.`;
 return `${shortProduct(p)?'Las piezas':'Los pares'} de ${p.name.toLocaleLowerCase('es-MX')} se suman en tu carrito, en paquetes o por separado. El precio de mayoreo se calcula con la cantidad total de este producto.`;
}
export function bundleVolumeMessages(item:Package):string[] {
 return [...new Set(item.items.map((part,index)=>volumePricingMessage({
  id:part.productId??-(index+1),name:part.name,category:part.category,categoryId:part.categoryId,
  gender:/\b(caballero|hombre)\b/i.test(part.name)?'Hombre':undefined,currentStock:0,rules:[],
 })))];
}
export function calculateGroups(products:Original[],lines:{id:number;quantity:number}[],packages:Package[]=[]) {
 const boxed=lines.filter(l=>l.id>0).flatMap(l=>(packages.find(p=>p.id===l.id)?.items||[]).map(i=>({id:-(i.productId||0),assorted:!!i.assorted,quantity:i.quantity*l.quantity,product:products.find(p=>p.id===i.productId)||(i.assorted&&i.categoryId!=null?products.find(p=>p.categoryId===i.categoryId):undefined)})));
 const productDemand=(id:number)=>lines.filter(l=>l.id===id).reduce((n,l)=>n+l.quantity,0)+boxed.filter(l=>l.id===id&&!l.assorted).reduce((n,l)=>n+l.quantity,0);
 const selected=lines.filter(l=>l.id<0).map(l=>({quantity:l.quantity,product:products.find(p=>p.id===-l.id),id:l.id}));
 const keys=[...new Set([...selected,...boxed].map(l=>l.product?pricingKey(l.product):`missing:${l.id}`))];
 return keys.map(key=>{
  const members=selected.filter(l=>(l.product?pricingKey(l.product):`missing:${l.id}`)===key);
  const boxMembers=boxed.filter(l=>(l.product?pricingKey(l.product):`missing:${l.id}`)===key);
  const quantity=[...members,...boxMembers].reduce((s,l)=>s+l.quantity,0);
  const assortmentAvailable=!boxMembers.some(l=>l.assorted)||products.filter(p=>pricingKey(p)===key).reduce((n,p)=>n+p.currentStock,0)>=quantity;
  const rows=members.map(l=>{
   const matches=l.product?.rules.filter(r=>quantity>=r.minQuantity&&(r.maxQuantity==null||quantity<=r.maxQuantity))||[];
   const price=matches.length===1?Number(matches[0].pricePerUnit):NaN;
   const valid=Number.isFinite(price)&&price>=0&&!!l.product&&productDemand(l.id)<=l.product.currentStock&&assortmentAvailable;
   return {...l,price:valid?price:null,total:valid?Math.round(price*100)*l.quantity/100:null};
  });
  const total=rows.every(l=>l.total!==null)?rows.reduce((s,l)=>s+Math.round(l.total!*100),0)/100:null;
  const next=rows.flatMap(l=>l.product?.rules.filter(r=>r.minQuantity>quantity&&l.price!==null&&Number(r.pricePerUnit)<l.price).map(r=>r.minQuantity)||[]).sort((a,b)=>a-b)[0];
  return {key,name:(members[0]||boxMembers[0]).product?pricingName((members[0]||boxMembers[0]).product!):'Producto no disponible',quantity,rows,total,next};
 });
}
