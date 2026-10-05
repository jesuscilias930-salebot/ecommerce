type Item = {name: string; category?: string | null};
export function packageCardContents(items:(Item&{quantity:number;assorted?:boolean;categoryId?:number|null})[]){
 const rows=new Map<string,{name:string;quantity:number;pieces:boolean;tripares:boolean}>();
 items.forEach((part,index)=>{
  const category=part.category?.trim();
  const key=part.assorted?(part.categoryId!=null?`category:${part.categoryId}`:category?`category-name:${category.toLocaleLowerCase('es-MX')}`:`unknown:${index}`):`fixed:${index}`;
  const row=rows.get(key);
  if(row)row.quantity+=part.quantity;
  else rows.set(key,{name:part.assorted?(category||'calcetines surtidos'):part.name,quantity:part.quantity,pieces:!part.assorted&&isShort(part),tripares:!part.assorted&&usesTripares(part)});
 });
 return [...rows.values()];
}
const normalized = (item: Item) => `${item.name} ${item.category || ''}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const isShort = (item: Item) => /\bshorts?\b/.test(normalized(item));
// These sock families are sold as three-pair sets; caricatura/económicos are not.
export const usesTripares = (item: Item) => !isShort(item) && /deport|licra|afelp/.test(normalized(item));
export const salePackSize = (item: Item) => usesTripares(item) ? 3 : 1;
export const saleUnit = (item: Item) => usesTripares(item) ? 'tripar' : isShort(item) ? 'pieza' : 'par';
export const saleUnits = (item: Item) => usesTripares(item) ? 'tripares' : isShort(item) ? 'piezas' : 'pares';
// Rules and API quantities remain in pairs. Round each base price to cents first.
export const saleUnitPrice = (price: number, item: Item) => Math.round(price * 100) * salePackSize(item) / 100;
export const saleQuantityLabel = (pairs: number, item: Item) => usesTripares(item) ? `${triparesLabel(pairs)||'0 tripares'} (${pairs} pares)` : `${pairs} ${pairs===1?saleUnit(item):saleUnits(item)}`;
export const saleTierBoundaries = (boundaries: number[], packSize: number) => [...new Set(boundaries.map(min => Math.max(1, Math.ceil(min / packSize))))].sort((a,b)=>a-b);
export function triparesLabel(pairs: number): string {
  const sets = Math.floor(pairs / 3);
  const remainder = pairs % 3;
  return [sets > 0 ? `${sets} ${sets === 1 ? 'tripar' : 'tripares'}` : '', remainder > 0 ? `${remainder} ${remainder === 1 ? 'par suelto' : 'pares sueltos'}` : ''].filter(Boolean).join(' + ');
}
export function bundlePresentation(parts: {quantity: number; tripares: boolean}[]): string | null {
  if (!parts.length || !parts.every(part => part.tripares)) return null;
  // Do not assemble a tripar out of leftovers belonging to different products.
  const sets = parts.reduce((sum, part) => sum + Math.floor(part.quantity / 3), 0);
  const loose = parts.reduce((sum, part) => sum + part.quantity % 3, 0);
  return [sets ? `${sets} ${sets === 1 ? 'tripar' : 'tripares'}` : '', loose ? `${loose} ${loose === 1 ? 'par suelto' : 'pares sueltos'}` : ''].filter(Boolean).join(' + ') || null;
}
export function packageQuantityLabel(item: {pieces: number; items: (Item & {quantity:number})[]}): string {
  const allSocks=item.items.length>0&&item.items.every(part=>!isShort(part));
  const sets=bundlePresentation(item.items.map(part=>({quantity:part.quantity,tripares:usesTripares(part)})));
  return `${item.pieces} ${allSocks?'pares':'unidades'}${sets?` · ${sets}`:''}`;
}
