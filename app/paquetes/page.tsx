import {getCatalog, parseBudget} from '@/lib/catalog';
import {Catalog} from '@/components/shop';
export const dynamic='force-dynamic';
export const metadata={title:'Paquetes para emprender'};
export default async function Page({searchParams}:{searchParams:Promise<{budget?:string|string[];q?:string|string[]}>}) {
 const params=await searchParams;const query=typeof params.q==='string'?params.q.slice(0,120):'';
 const budget=parseBudget(params.budget);
 const data=await getCatalog(budget);
 return <main id="contenido" className="section">{data.demo&&<p className="demo">Catálogo de demostración · Precios ilustrativos</p>}<div className="page-heading"><span className="eyebrow">ELIGE TU SIGUIENTE PASO</span><h1>Un paquete para tu idea.</h1><p>Explora, compara y encuentra la inversión con la que quieres comenzar.</p></div><Catalog items={data.packages} budget={budget} error={data.error} initialQuery={query}/></main>;
}
