import 'server-only';
import { productDisplayName } from './product-name';
import { getStoreTenant } from './store-tenant';
import { pricingKey } from './live-pricing';
export type Tier={minQuantity:number;maxQuantity:number|null;pricePerUnit:number|string};
export type Original = {imageUrls?:string[];imageUrl?:string|null; id:number; name:string; category?:string|null;categoryId?:number|null; size?:string; gender?:string; pricingGroup?:string; currentStock:number;rules:Tier[]};
export const isProductDemo=()=>process.env.STOREFRONT_PRODUCTS_MOCK==='true'||!process.env.SOCK_CONTROL_URL;
const tiers=(price:number):Tier[]=>[{minQuantity:1,maxQuantity:49,pricePerUnit:price},{minQuantity:50,maxQuantity:99,pricePerUnit:price-2},{minQuantity:100,maxQuantity:null,pricePerUnit:price-4}];
const mockProducts:Original[]=[
 {id:900000001,name:'Calcetín de caricatura para dama',gender:'Mujer',size:'22–25',category:'Caricatura',categoryId:1,pricingGroup:'caricatura',currentStock:500,rules:tiers(20)},
 {id:900000002,name:'Calcetín de caricatura para caballero',gender:'Hombre',size:'25–28',category:'Caricatura',categoryId:1,pricingGroup:'caricatura',currentStock:500,rules:tiers(20)},
 {id:900000003,name:'Calcetín deportivo blanco',gender:'Unisex',size:'Unitalla',category:'Deportivo',categoryId:2,pricingGroup:'deportivo',currentStock:300,rules:tiers(18)},
 {id:900000004,name:'Calcetín deportivo negro',gender:'Unisex',size:'Unitalla',category:'Deportivo',categoryId:2,pricingGroup:'deportivo',currentStock:250,rules:tiers(18)},
 {id:900000005,name:'Calcetín térmico',gender:'Unisex',size:'Unitalla',category:'Térmico',categoryId:3,pricingGroup:'termico',currentStock:150,rules:tiers(28)},
 {id:900000006,name:'Calcetín infantil surtido',gender:'Infantil',size:'18–21',category:'Infantil',categoryId:4,pricingGroup:'infantil',currentStock:0,rules:tiers(16)},
];
function mockQuote(body:unknown) {
 const quantities=new Map<number,number>();
 for(const line of body as {productId:number;quantity:number}[]) quantities.set(line.productId,(quantities.get(line.productId)||0)+line.quantity);
 const selected=Array.from(quantities,([id,quantity])=>{
  const product=mockProducts.find(p=>p.id===id);
  if(!product||quantity<1||quantity>product.currentStock)throw new Error('Producto o stock de demostración no disponible');
  return {product,quantity};
 });
 const lines=selected.map(({product:p,quantity})=>{
  const groupQuantity=selected.filter(l=>pricingKey(l.product)===pricingKey(p)).reduce((sum,l)=>sum+l.quantity,0);
  const rule=p.rules.find(r=>groupQuantity>=r.minQuantity&&(r.maxQuantity===null||groupQuantity<=r.maxQuantity));
  if(!rule)throw new Error('Sin tarifa');
  const unitPrice=Number(rule.pricePerUnit);
  return {productId:p.id,name:p.name,quantity,groupQuantity,unitPrice,subtotal:unitPrice*quantity};
 });
 return {demo:true,lines,subtotal:lines.reduce((sum,l)=>sum+l.subtotal,0)};
}
export async function stockApi(path:string, body?:unknown) {
 const tenant = await getStoreTenant();
 if(isProductDemo()&&path==='/public/store/quote')return mockQuote(body);
 const base=process.env.SOCK_CONTROL_URL;
 if(!base) throw new Error('Conexión con inventario pendiente de configurar.');
 const allowed=['/public/store/cart-quote','/public/store/products/in-stock','/public/store/price-rules','/public/store/quote','/public/store/orders','/public/store/bundles','/public/store/checkout','/public/store/features'];
 if(!allowed.includes(path)) throw new Error('Ruta de tienda no permitida.');
 const response=await fetch(`${base.replace(/\/$/,'')}${path}`,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','X-Store-Tenant':tenant},body:body?JSON.stringify(body):undefined,cache:'no-store',signal:AbortSignal.timeout(15000)});
 if(!response.ok) throw new Error('No se pudo validar el precio. Revisa stock y reglas de precios en sock-control.');
 return response.json();
}
export async function getOriginals():Promise<Original[]> {
 await getStoreTenant();
 if(isProductDemo())return mockProducts.map(p=>({...p,name:productDisplayName(p)}));
 const [products,rules]:[Original[],Record<string,Tier[]>]=await Promise.all([stockApi('/public/store/products/in-stock'),stockApi('/public/store/price-rules')]);
 return products.map(p=>({...p,name:productDisplayName(p),rules:(rules[String(p.id)]||[]).filter(r=>r.minQuantity>0&&Number.isFinite(Number(r.pricePerUnit))).sort((a,b)=>a.minQuantity-b.minQuantity)}));
}
