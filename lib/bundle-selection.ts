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
export function customizable(item:Package){return item.items.length>0&&item.items.every(i=>i.assorted&&i.categoryId!=null&&i.categoryId===item.items[0].categoryId&&/caricatura/i.test(i.category||''));}
export const selectionKey=(value?:Selection)=>JSON.stringify(cleanSelection(value)||null);
