/**
 * Agrupa por sección de la tienda (si se configuró en MerlynSeller) o por categoría.
 * Varias categorías con la misma sección quedan en una sola pestaña.
 */
export function groupByCategory<T extends {category?:string|null;categoryId?:number|null;section?:string|null;sectionOrder?:number|null}>(products:T[]) {
 const groups=new Map<string,{key:string;label:string;order:number;products:T[]}>();
 for(const product of products){
  const category=product.category?.trim().replace(/\s+/g,' ')||'';
  const section=product.section?.trim().replace(/\s+/g,' ')||'';
  const key=section?`section:${section.toLocaleLowerCase('es-MX')}`:product.categoryId!=null?`category-id:${product.categoryId}`:category?`category:${category.toLocaleLowerCase('es-MX')}`:'uncategorized';
  const order=Number.isFinite(Number(product.sectionOrder))?Number(product.sectionOrder):0;
  const group=groups.get(key)||{key,label:section||category||'Otros productos',order,products:[]};
  group.order=Math.min(group.order,order);
  group.products.push(product);groups.set(key,group);
 }
 return [...groups.values()].sort((a,b)=>a.key==='uncategorized'?1:b.key==='uncategorized'?-1:a.order-b.order||a.label.localeCompare(b.label,'es'));
}
