import {getOriginals,isProductDemo} from '@/lib/product-catalog';
import {getCatalog} from '@/lib/catalog';
import {Originals} from '@/components/originals';
import {getTestimonialPhotos} from '@/components/testimonial-photos';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{q?:string|string[]}>}){
 const params=await searchParams;const query=typeof params.q==='string'?params.q.slice(0,120):'';
 try {const [products,catalog,references]=await Promise.all([getOriginals(),getCatalog(),getTestimonialPhotos()]);return <main className="section" id="contenido"><h1>Productos individuales</h1>{isProductDemo()&&<p className="demo" role="status">Demostración: productos, precios y stock ficticios. No se pueden realizar pedidos.</p>}<p>Elige género, color y talla en cada producto. El precio baja según la cantidad que lleves.</p><Originals products={products} packages={catalog.packages} initialQuery={query} references={references.slice(0,2)}/></main>;}
 catch {return <main className="section"><h1>Productos individuales</h1><p role="alert">No se pudo conectar con el inventario. Revisa la configuración de sock-control.</p></main>;}
}
