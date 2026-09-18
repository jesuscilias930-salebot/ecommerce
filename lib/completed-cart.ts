export type CartLine={id:number;quantity:number};
export const CHECKOUT_ATTEMPT_KEY='merlyn-pending-checkout-v1';
// Return null for an unrelated/old receipt. Preserve a cart edited since checkout.
export function completedCart(lines:CartLine[],folio:string,raw:string|null):CartLine[]|null {
 try {
  const attempt=JSON.parse(raw||'null');
  if(!attempt||typeof attempt.id!=='string'||folio!=='MS-'+attempt.id.toLowerCase())return null;
  const body=JSON.parse(attempt.body);
  if(!Array.isArray(body.products)||!Array.isArray(body.bundles))return null;
  const purchased:CartLine[]=[...body.products.map((p:{productId:number;quantity:number})=>({id:-p.productId,quantity:p.quantity})),...body.bundles.map((b:{bundleId:number;quantity:number})=>({id:b.bundleId,quantity:b.quantity}))];
  if(!purchased.length||purchased.some(p=>!Number.isInteger(p.id)||p.id===0||!Number.isInteger(p.quantity)||p.quantity<1))return null;
  const same=lines.length===purchased.length&&lines.every(l=>purchased.some(p=>p.id===l.id&&p.quantity===l.quantity));
  return same?[]:lines;
 }catch{return null;}
}
