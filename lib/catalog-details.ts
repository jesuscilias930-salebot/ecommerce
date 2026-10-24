import 'server-only';

export type CatalogDetail={color?:string|null;model?:string|null};
const text=(value:unknown)=>typeof value==='string'&&value.trim()?value.trim().slice(0,80):null;

/**
 * Color y modelo de cada producto, guardados en MerlynSeller. Son opcionales:
 * si MerlynSeller no responde, la tienda funciona igual sin agrupar por color.
 */
export async function getCatalogDetails():Promise<Map<number,CatalogDetail>>{
 const base=process.env.MERLYN_SELLER_API_URL,secret=process.env.MERLYN_SELLER_STORE_SECRET;
 if(!base||!secret||secret.length<32){if(process.env.NODE_ENV!=='production')console.warn('Colores del catálogo desactivados: falta MERLYN_SELLER_API_URL o MERLYN_SELLER_STORE_SECRET');return new Map();}
 try{
  const response=await fetch(`${base.replace(/\/$/,'')}/store-orders/catalog-details`,{headers:{'X-Store-Secret':secret},cache:'no-store',signal:AbortSignal.timeout(5000)});
  if(!response.ok){console.warn('MerlynSeller no envió colores del catálogo',{status:response.status});return new Map();}
  const rows:unknown=await response.json();
  if(!Array.isArray(rows))return new Map();
  return new Map(rows.filter(row=>row&&Number.isSafeInteger(row.productId)&&row.productId>0).map(row=>[row.productId as number,{color:text(row.color),model:text(row.model)}]));
 }catch(error){console.warn('MerlynSeller no respondió para colores del catálogo',{reason:error instanceof Error?error.name:'unknown'});return new Map();}
}
