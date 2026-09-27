import type {Package} from './catalog';
export function packageCategories(items:Package[]) {
 const groups=new Map<string,Package[]>();
 for(const item of items){
  const name=item.storeCategory?.trim()||'Otros paquetes';
  groups.set(name,[...(groups.get(name)||[]),item]);
 }
 return [...groups].map(([name,items])=>({name,items}));
}
