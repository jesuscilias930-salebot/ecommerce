import {getCatalog} from '@/lib/catalog';
import type {PackageFilter} from '@/lib/package-categories';
import {Catalog} from '@/components/shop';
export const dynamic='force-dynamic';
export const metadata={title:'Paquetes para emprender'};
export default async function Page({searchParams}:{searchParams:Promise<{category?:string|string[];q?:string|string[]}>}) {
 const params=await searchParams;const query=typeof params.q==='string'?params.q.slice(0,120):'';
 const category:PackageFilter=typeof params.category==='string'&&['caricatura','deportivo','surtido'].includes(params.category)?params.category as PackageFilter:'all';
 const data=await getCatalog();
 return <main id="contenido" className="section">{data.demo&&<p className="demo">Catálogo de demostración · Precios ilustrativos</p>}<div className="page-heading"><span className="eyebrow">ELIGE TU SIGUIENTE PASO</span><h1>Un paquete para tu idea.</h1><p>Explora los paquetes por categoría y elige el contenido para tu negocio.</p></div><Catalog items={data.packages} category={category} error={data.error} initialQuery={query}/></main>;
}
