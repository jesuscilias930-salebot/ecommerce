import 'server-only';

export type CatalogSection={section:string;position:number};

/**
 * Sección de la página de productos para cada categoría, configurada en MerlynSeller → E-commerce → Categorías.
 * Es opcional: si MerlynSeller no responde, cada categoría se muestra por separado.
 */
export async function getCatalogSections():Promise<Map<number,CatalogSection>>{
 const base=process.env.MERLYN_SELLER_API_URL,secret=process.env.MERLYN_SELLER_STORE_SECRET;
 if(!base||!secret||secret.length<32)return new Map();
 try{
  const response=await fetch(`${base.replace(/\/$/,'')}/store-orders/catalog-sections`,{headers:{'X-Store-Secret':secret},cache:'no-store',signal:AbortSignal.timeout(5000)});
  if(!response.ok){console.warn('MerlynSeller no envió las secciones del catálogo',{status:response.status});return new Map();}
  const rows:unknown=await response.json();
  if(!Array.isArray(rows))return new Map();
  return new Map(rows.filter(row=>row&&Number.isSafeInteger(row.categoryId)&&row.categoryId>0&&typeof row.section==='string'&&row.section.trim())
   .map(row=>[row.categoryId as number,{section:String(row.section).trim().slice(0,60),position:Number.isFinite(Number(row.position))?Number(row.position):0}]));
 }catch(error){console.warn('MerlynSeller no respondió para las secciones del catálogo',{reason:error instanceof Error?error.name:'unknown'});return new Map();}
}
