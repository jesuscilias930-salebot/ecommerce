import 'server-only';
import { getStoreTenant } from './store-tenant';
export type Package = { imageUrls?:string[]; imageUrl?:string|null; id: number; name: string; price: number; available: number; pieces: number; boxLengthCm?:number|null; boxWidthCm?:number|null; boxHeightCm?:number|null; boxWeightKg?:number|null; items: { id?:number; productId?:number; name: string; quantity: number; assignedUnitPrice?:number|null }[]; tone: number };
type Bundle = { imageUrls?:string[]; imageUrl?:string|null; id: number; name: string; fixedPrice: number | string; boxLengthCm?:number|string|null; boxWidthCm?:number|string|null; boxHeightCm?:number|string|null; boxWeightKg?:number|string|null; items: { id?:number; productId: number; productName: string; quantity: number; assignedUnitPrice?:number|string|null }[] };
type Product = { id: number; currentStock: number };
const numberOrNull=(value:unknown)=>value==null||value===''||!Number.isFinite(Number(value))?null:Number(value);
const bundleDetails=(b:Bundle)=>({imageUrl:b.imageUrl,imageUrls:b.imageUrls,
 boxLengthCm:numberOrNull(b.boxLengthCm),boxWidthCm:numberOrNull(b.boxWidthCm),boxHeightCm:numberOrNull(b.boxHeightCm),boxWeightKg:numberOrNull(b.boxWeightKg),
 items:b.items.map(i=>({id:i.id,productId:i.productId,name:i.productName,quantity:i.quantity,assignedUnitPrice:numberOrNull(i.assignedUnitPrice)}))
});
const demoBundles:Bundle[]=[
 {id:1,name:'Tu primer negocio',fixedPrice:1290,boxLengthCm:30,boxWidthCm:25,boxHeightCm:20,boxWeightKg:2.4,items:[{id:1,productId:101,productName:'Calcetín caricatura dama',quantity:30,assignedUnitPrice:16},{id:2,productId:102,productName:'Calcetín caricatura caballero',quantity:30,assignedUnitPrice:16},{id:3,productId:103,productName:'Calcetín deportivo blanco',quantity:20,assignedUnitPrice:16.5}]},
 {id:2,name:'Caja emprendedora',fixedPrice:2490,boxLengthCm:40,boxWidthCm:30,boxHeightCm:30,boxWeightKg:5.2,items:[{id:4,productId:101,productName:'Calcetín caricatura dama',quantity:60,assignedUnitPrice:14},{id:5,productId:102,productName:'Calcetín caricatura caballero',quantity:60,assignedUnitPrice:14},{id:6,productId:104,productName:'Calcetín deportivo negro',quantity:60,assignedUnitPrice:13.5}]},
 {id:3,name:'Dale más a tu negocio',fixedPrice:3990,boxLengthCm:50,boxWidthCm:40,boxHeightCm:35,boxWeightKg:8.5,items:[{id:7,productId:101,productName:'Calcetín caricatura dama',quantity:100,assignedUnitPrice:13.3},{id:8,productId:102,productName:'Calcetín caricatura caballero',quantity:100,assignedUnitPrice:13.3},{id:9,productId:104,productName:'Calcetín deportivo negro',quantity:100,assignedUnitPrice:13.3}]},
 {id:4,name:'Esenciales deportivos',fixedPrice:1890,boxLengthCm:35,boxWidthCm:30,boxHeightCm:25,boxWeightKg:3.1,items:[{id:10,productId:103,productName:'Calcetín deportivo blanco',quantity:50,assignedUnitPrice:18.9},{id:11,productId:104,productName:'Calcetín deportivo negro',quantity:50,assignedUnitPrice:18.9}]},
];
const demo:Package[]=demoBundles.map((b,tone)=>({id:b.id,name:b.name,price:Number(b.fixedPrice),available:8,pieces:b.items.reduce((sum,i)=>sum+i.quantity,0),tone,...bundleDetails(b)}));
export type Budget = 'all' | 'low' | 'mid' | 'high';
export function parseBudget(value: unknown): Budget {
 return value === 'low' || value === 'mid' || value === 'high' ? value : 'all';
}
export async function getCatalog(budget: Budget = 'all'): Promise<{packages: Package[]; demo: boolean; error?: string}> {
 const tenant = await getStoreTenant();
 const base=process.env.SOCK_CONTROL_URL;
 // Demo filtering runs only on the Next server, never in the browser.
 if(!base||process.env.STOREFRONT_BUNDLES_MOCK==='true') return {packages:demo.filter(p=>budget==='all'||(budget==='low'&&p.price<1500)||(budget==='mid'&&p.price>=1500&&p.price<=3000)||(budget==='high'&&p.price>3000)),demo:true};
 try {
  const ids=(process.env.STOREFRONT_BUNDLE_IDS||'').split(',').map(Number).filter(n=>Number.isInteger(n)&&n>0);
  async function read<T>(path:string):Promise<T> {
   const response=await fetch(`${base!.replace(/\/$/,'')}${path}`,{headers:{'X-Store-Tenant':tenant},cache:'no-store',signal:AbortSignal.timeout(10000)});
   if(!response.ok) throw new Error(`Catalog HTTP ${response.status}`);
   return response.json();
  }
  const [bundles,products]=await Promise.all([read<Bundle[]>('/public/store/bundles?budget='+encodeURIComponent(budget)),read<Product[]>('/public/store/products/in-stock')]);
  const stock=new Map(products.map(p=>[p.id,p.currentStock]));
  const packages=bundles.filter(b=>(!ids.length||ids.includes(b.id))&&Number(b.fixedPrice)>0&&b.items.length>0&&b.items.every(i=>Number.isInteger(i.quantity)&&i.quantity>0)).map((b,index)=>{
   const quantities=new Map<number,number>(); b.items.forEach(i=>quantities.set(i.productId,(quantities.get(i.productId)||0)+i.quantity));
   return {id:b.id,name:b.name,price:Number(b.fixedPrice),available:Math.max(0,Math.min(...Array.from(quantities,([id,qty])=>Math.floor((stock.get(id)||0)/qty)))),pieces:b.items.reduce((n,i)=>n+i.quantity,0),...bundleDetails(b),tone:index%4};
  });
  return {packages:packages.filter(p=>p.available>0),demo:false};
 } catch { return {packages:[],demo:false,error:'No pudimos cargar los paquetes. Intenta nuevamente en unos momentos.'}; }
}
