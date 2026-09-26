import {getOriginals,isProductDemo} from '@/lib/product-catalog';
import {getCatalog} from '@/lib/catalog';
import {Originals} from '@/components/originals';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{q?:string|string[]}>}){
 const params=await searchParams;const query=typeof params.q==='string'?params.q.slice(0,120):'';
 try {const [products,catalog]=await Promise.all([getOriginals(),getCatalog()]);return <main className="section" id="contenido"><h1>Productos individuales</h1>{isProductDemo()&&<p className="demo" role="status">Demostración: productos, precios y stock ficticios. No se pueden realizar pedidos.</p>}<p>Combina variantes del mismo grupo y obtén el precio por volumen.</p><Originals products={products} packages={catalog.packages} initialQuery={query}/></main>;}
 catch {return <main className="section"><h1>Productos individuales</h1><p role="alert">No se pudo conectar con el inventario. Revisa la configuración de sock-control.</p></main>;}
}
