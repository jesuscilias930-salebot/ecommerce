import type {Package} from './catalog';
export function packageCategories(items:Package[]) {
 const groups=new Map<string,Package[]>();
 for(const item of items){
  const categories=[...new Set((item.items||[]).map(part=>part.category?.trim()).filter((name):name is string=>!!name))];
  const inferred=categories.length===1?categories[0]:categories.length>1?'Paquetes surtidos':undefined;
  const name=item.storeCategory?.trim()||inferred||'Otros paquetes';
  groups.set(name,[...(groups.get(name)||[]),item]);
 }
 return [...groups].map(([name,items])=>({name,items}));
}
