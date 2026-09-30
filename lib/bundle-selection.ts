import type {Package} from './catalog';
export type Selection={productId:number;quantity:number}[];
export type CartLine={id:number;quantity:number;selection?:Selection};
export function validSelection(value:unknown):value is Selection {
 if(value===undefined)return true;
 return Array.isArray(value)&&value.length>0&&value.length<=200&&value.every(s=>s&&Number.isSafeInteger(s.productId)&&s.productId>0&&Number.isInteger(s.quantity)&&s.quantity>0&&s.quantity<=100000)&&new Set(value.map(s=>s.productId)).size===value.length;
}
export function cleanSelection(value:unknown):Selection|undefined {
 if(!validSelection(value))throw Error('Combinación inválida');
 return value===undefined?undefined:(value as Selection).map(s=>({productId:s.productId,quantity:s.quantity})).sort((a,b)=>a.productId-b.productId);
}
export function bundleInput(b:{bundleId:number;quantity:number;selection?:Selection}){return {bundleId:b.bundleId,quantity:b.quantity,...(b.selection!==undefined?{selection:cleanSelection(b.selection)}:{})};}
export function customizableParts(item:Package){return item.items.filter(i=>i.assorted);}
export function customizable(item:Package){const parts=customizableParts(item);return parts.length>0&&parts.every(i=>i.categoryId!=null&&i.categoryId===parts[0].categoryId&&/caricatura/i.test(i.category||''));}
export const selectionKey=(value?:Selection)=>JSON.stringify(cleanSelection(value)||null);
export const cartLineKey=(line:CartLine)=>`${line.id}:${selectionKey(line.selection)}`;
export const cartCount=(lines:CartLine[])=>lines.reduce((n,l)=>n+(l.id>0?l.quantity:1),0);
export function setCartQuantity(lines:CartLine[],id:number,quantity:number,selection?:Selection){
 const key=cartLineKey({id,quantity,selection});
 if(quantity<=0)return lines.filter(l=>cartLineKey(l)!==key);
 const next={id,quantity:Math.min(quantity,100000),...(selection?{selection:cleanSelection(selection)}:{})};
 return lines.some(l=>cartLineKey(l)===key)?lines.map(l=>cartLineKey(l)===key?next:l):[...lines,next];
}
