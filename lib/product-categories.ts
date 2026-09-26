export function groupByCategory<T extends {category?:string|null;categoryId?:number|null}>(products:T[]) {
 const groups=new Map<string,{key:string;label:string;products:T[]}>();
 for(const product of products){
  const category=product.category?.trim().replace(/\s+/g,' ')||'';
  const key=product.categoryId!=null?`category-id:${product.categoryId}`:category?`category:${category.toLocaleLowerCase('es-MX')}`:'uncategorized';
  const group=groups.get(key)||{key,label:category||'Otros productos',products:[]};
  group.products.push(product);groups.set(key,group);
 }
 return [...groups.values()].sort((a,b)=>a.key==='uncategorized'?1:b.key==='uncategorized'?-1:a.label.localeCompare(b.label,'es'));
}
