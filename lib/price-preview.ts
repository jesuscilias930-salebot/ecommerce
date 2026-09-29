import type {Tier,Original} from './product-catalog';
import type {Package} from './catalog';
import type {CartLine} from './bundle-selection';
export function lowestTier(rules:Tier[]){return rules.filter(r=>r.minQuantity>0&&Number.isFinite(Number(r.pricePerUnit))&&Number(r.pricePerUnit)>=0).sort((a,b)=>Number(a.pricePerUnit)-Number(b.pricePerUnit)||a.minQuantity-b.minQuantity)[0];}
export function nextDiscount(rules:Tier[],quantity:number,price:number){
 const tier=rules.filter(r=>r.minQuantity>quantity&&Number(r.pricePerUnit)<price).sort((a,b)=>a.minQuantity-b.minQuantity)[0];
 return tier?{quantity:tier.minQuantity,missing:tier.minQuantity-quantity,price:Number(tier.pricePerUnit),savingPerUnit:Math.round((price-Number(tier.pricePerUnit))*100)/100}:null;
}
// Subtract exact custom compositions as well as fixed bundles. Automatic assortments
// require the server's pooled-stock check and must not be allocated to a guessed gender.
export function fixedPairsInCart(productId:number,lines:CartLine[],packages:Package[]){
 return lines.reduce((sum,line)=>sum+(line.id<0?(line.id===-productId?line.quantity:0):line.quantity*(line.selection?.filter(s=>s.productId===productId).reduce((n,s)=>n+s.quantity,0)??packages.find(p=>p.id===line.id)?.items.filter(i=>i.productId===productId&&!i.assorted).reduce((n,i)=>n+i.quantity,0)??0)),0);
}
export function halfSelection(total:number,boxes:number,candidates:Original[],lines:CartLine[],packages:Package[]){
 if(candidates.length!==2||!Number.isInteger(total)||total%2!==0||!Number.isInteger(boxes)||boxes<1)return null;
 const each=total/2;
 if(candidates.some(p=>p.currentStock-fixedPairsInCart(p.id,lines,packages)<each*boxes))return null;
 return candidates.map(p=>({productId:p.id,quantity:each}));
}
