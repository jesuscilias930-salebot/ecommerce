import {getOriginals} from '@/lib/product-catalog';
import {PurchaseSteps} from '@/components/purchase-steps';
import '../live-summary.css';
import {getCatalog} from '@/lib/catalog';
import {VolumeCart as Cart} from '@/components/volume-cart';
export const dynamic='force-dynamic';
export const metadata={title:'Carrito'};
export default async function Page(){const [data,products]=await Promise.all([getCatalog(),getOriginals().catch(()=>[])]);return <main id="contenido" className="section"><div className="page-heading"><PurchaseSteps step={1}/><h1>Tu carrito.</h1><p>Revisa tus productos. La dirección y el envío vienen después.</p></div><Cart products={products} items={data.packages} demo={data.demo} error={data.error}/></main>}
