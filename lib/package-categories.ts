import type {Package} from './catalog';
export type PackageFilter='all'|'caricatura'|'deportivo'|'surtido';
export function packageFilter(item:Package):PackageFilter {
 const normalize=(name:string)=>name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const declared=normalize(item.storeCategory?.trim()||'');
 if(/surtid|mixt/.test(declared))return 'surtido';
 if(/caricatura/.test(declared))return 'caricatura';
 if(/deport/.test(declared))return 'deportivo';
 const categories=item.items.map(part=>normalize(part.category||''));
 if(categories.length&&categories.every(name=>/caricatura/.test(name)))return 'caricatura';
 if(categories.length&&categories.every(name=>/deport|licra/.test(name)))return 'deportivo';
 if(new Set(categories.filter(Boolean)).size>1)return 'surtido';
 return 'all';
}
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
