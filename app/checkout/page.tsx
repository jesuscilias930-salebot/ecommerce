import {PurchaseSteps} from '@/components/purchase-steps';
import {getOriginals} from '@/lib/product-catalog';
import {getCatalog} from '@/lib/catalog';
import {VolumeCart} from '@/components/volume-cart';
import '../live-summary.css';
import {getStoreFeatures} from '@/lib/store-features';
import {redirect} from 'next/navigation';

export const dynamic='force-dynamic';
export const metadata={title:'Dirección y pago',robots:{index:false,follow:false}};
export default async function Page(){
 if(!(await getStoreFeatures()).cardPaymentsEnabled)redirect('/carrito');
 const [data,products]=await Promise.all([getCatalog(),getOriginals().catch(()=>[])]);
 return <main id="contenido" className="section">
  <div className="page-heading"><PurchaseSteps step={2}/><h1>¿Dónde lo recibes?</h1><p>Completa tu dirección y elige un envío. Después pasarás al pago seguro.</p></div>
  <VolumeCart addressPage products={products} items={data.packages} demo={data.demo} error={data.error}/>
 </main>;
}
