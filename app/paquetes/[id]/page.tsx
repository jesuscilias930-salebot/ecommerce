import {PurchaseConfidence} from '@/components/store-trust';
import {BundleDescription} from '@/components/bundle-description';
import {BundleContent} from '@/components/bundle-content';
import './breakdown.css';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getCatalog} from '@/lib/catalog';
import {money} from '@/lib/money';
import {AddButton, Card} from '@/components/shop';
import {relatedPackages} from '@/lib/shopping-discovery';
import styles from '@/components/shopping-discovery.module.css';
import {BoxArt} from '@/components/box-art';
import {StorePhoto} from '@/components/store-photo';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const data=await getCatalog();
  if(data.error) return <main id="contenido" className="section"><p role="alert">{data.error}</p><Link href="/paquetes">Volver al catálogo</Link></main>;
  const item=data.packages.find(p=>String(p.id)===id);
  if(!item) notFound();
  const related=relatedPackages(item,data.packages);
  return <main id="contenido" className={`section ${styles.detailPage}`}>
    {data.demo&&<p className="demo">Paquete de demostración · Contenido y precio ilustrativos</p>}
    <nav className={styles.breadcrumbs} aria-label="Ruta de navegación"><Link href="/">Inicio</Link><span aria-hidden="true">/</span><Link href="/paquetes">Paquetes</Link><span aria-hidden="true">/</span><span aria-current="page">{item.name}</span></nav>
    <div className={styles.detailLayout}>
      <div className={styles.detailMain}>
        <StorePhoto zoom images={item.imageUrls} src={item.imageUrl} name={item.name}><BoxArt tone={item.tone} large/></StorePhoto>
        <nav className={styles.jumpLinks} aria-label="Información del paquete"><a href="#contenido-paquete">Qué incluye</a><a href="#dudas-paquete">Envío y compra</a><Link href="/referencias">Referencias de clientes</Link></nav>
        <section id="contenido-paquete" className={styles.content} aria-labelledby="content-title"><h2 id="content-title">Todo lo que incluye tu caja</h2><BundleContent item={item} showHeading={false}/><p className="fine-print">Confirma tallas, colores y surtido antes de comprar. Las imágenes son de referencia.</p></section>
        <section id="dudas-paquete" className={styles.content} aria-labelledby="questions-title"><h2 id="questions-title">Resuelve tus dudas antes de comprar</h2>
          <details><summary>¿Cuánto pagaré de envío?</summary><p>El envío no está incluido en el precio de la caja. Al continuar al checkout, completa tu dirección para ver las opciones disponibles y elegir una antes del pago.</p></details>
          <details><summary>¿Necesito registrarme?</summary><p>No. Puedes preparar tu pedido como invitado. También puedes concluirlo por WhatsApp y recibir atención para coordinar tu compra.</p></details>
          <details><summary>¿Puedo elegir las tallas y los diseños?</summary><p>El contenido corresponde al desglose de esta caja. Consulta con un asesor las tallas, colores y el surtido disponible antes de confirmar; una fotografía no garantiza un diseño específico.</p><Link href="/ayuda#contacto">Consultar con un asesor →</Link></details>
          <details><summary>¿Qué hago si hay un problema con mi pedido?</summary><p>Consulta las condiciones de cambios, cancelaciones y atención antes de comprar.</p><Link href="/envios-y-devoluciones">Ver políticas de envío y devoluciones →</Link></details>
        </section>
      </div>
      <section className={styles.purchaseBox} id="comprar-paquete" aria-labelledby="bundle-title" style={{scrollMarginTop:20}}>
        <span className="eyebrow">CAJA DE MAYOREO · COMPRA COMO INVITADO</span><h1 id="bundle-title">{item.name}</h1><BundleDescription text={item.description}/>
        <p className="detail-price">{money(item.price)} <small>MXN</small></p><p>Referencia por 1 caja con IVA · Envío aparte. Al combinar cajas y pares individuales, ajustamos el precio por categoría.</p>
        <dl className={styles.facts}><div><dt>Pares por caja</dt><dd>{item.pieces}</dd></div><div><dt>Promedio de referencia por par</dt><dd>{item.pieces>0?money(item.price/item.pieces):'—'}</dd></div></dl>
        <p className="stock">{item.available?`${item.available} cajas disponibles`:'Temporalmente agotado'}</p>
        <AddButton key={item.id} item={item} chooseQuantity/>
        <PurchaseConfidence bundleId={item.id}/>
      </section>
    </div>
    {related.length>0&&<section className={styles.content} aria-labelledby="related-title"><h2 id="related-title">Otras opciones para tu negocio</h2><p>Paquetes disponibles con productos en común o una inversión cercana. Compara el contenido antes de elegir.</p><div className="product-grid">{related.map(candidate=><Card key={candidate.id} item={candidate}/>)}</div><Link className="text-link" href="/paquetes">Comparar todos los paquetes →</Link></section>}
    <div className={styles.mobilePurchase}><div><strong>{money(item.price)}</strong><small>Referencia por 1 caja · {item.pieces} pares · Más envío</small></div><a href="#comprar-paquete">Elegir cantidad ↑</a></div>
  </main>;
}
