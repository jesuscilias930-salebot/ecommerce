import {TrustSection,CustomerReferences,CommunitySection} from '@/components/store-trust';
import Link from 'next/link';
import {ArrowRight,ArrowUpRight,Package,Truck,MessagesSquare} from 'lucide-react';
import {getCatalog} from '@/lib/catalog';
import {PackageSections} from '@/components/shop';
import {BoxArt} from '@/components/box-art';
import {money} from '@/lib/money';
export const dynamic='force-dynamic';
export default async function Home(){
 const data=await getCatalog();
 const starting=data.packages.filter(p=>p.available>0&&p.price>0).sort((a,b)=>a.price-b.price)[0];
 const featured=data.packages.find(p=>p.imageUrl);
 return <main id="contenido">
  {data.demo&&<div className="demo">Vista de demostración · Paquetes y precios ilustrativos</div>}
  <section className="hero">
   <div className="hero-copy">
    <span className="eyebrow">MAYOREO PARA EMPRENDER Y RESURTIR</span>
    <h1>Calcetines para<br/><em>tu negocio.</em></h1>
    <p>Elige un paquete listo o compra por producto. Consulta el contenido, ajusta las cantidades y compra sin registrarte.</p>
    {starting&&<p className="hero-starting">Paquetes desde <strong>{money(starting.price)} MXN</strong><small>IVA incluido · Envío cotizado por separado.</small></p>}
    <div className="hero-actions"><Link className="primary" href="/paquetes">Ver paquetes <ArrowUpRight size={20}/></Link><Link href="/productos">Comprar por producto →</Link></div>
    <span className="hero-note">Conoce el total con envío antes de pagar.</span>
   </div>
   <div className="hero-art">
    {featured?<Link className="hero-product-photo" href={`/paquetes/${featured.id}`}><img src={featured.imageUrl!} alt={`Fotografía del paquete ${featured.name}`} fetchPriority="high"/><span>Conoce {featured.name} →</span></Link>:<BoxArt tone={1} large/>}
   </div>
  </section>
  <div className="benefits"><span><Package/> Contenido y cantidades claros</span><span><Truck/> Envío cotizado para tu destino</span><span><MessagesSquare/> Atención por WhatsApp</span></div>
  <section className="section"><div className="section-heading"><div><span className="eyebrow">ELIGE SEGÚN TU PRESUPUESTO</span><h2>Encuentra tu punto de partida.</h2></div><Link href="/paquetes">Ver todos los paquetes <ArrowRight size={18}/></Link></div>{data.error?<p role="alert">{data.error}</p>:<PackageSections items={data.packages} limitPerCategory={3}/>}{!data.error&&!data.packages.length&&<p>Estamos preparando nuestros paquetes. Vuelve pronto.</p>}</section>
  <TrustSection/>
  <section className="how section" id="como-funciona"><div><span className="eyebrow">DE LA IDEA AL PRIMER PEDIDO</span><h2>Comprar, paso a paso.</h2><p>Sin crear una cuenta.</p></div><ol>{[['Elige tu mercancía','Revisa el contenido y agrega paquetes o productos a tu carrito.'],['Dirección y envío','Completa tu dirección y consulta las tarifas antes de pagar.'],['Concluye tu pedido','Usa el pago con tarjeta cuando esté disponible o coordina tu compra por WhatsApp.']].map(([title,text],i)=><li key={title}><span>0{i+1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol></section>
  <CustomerReferences/><CommunitySection productPhoto={featured?.imageUrl?{url:featured.imageUrl,name:featured.name}:undefined}/>
  <section className="section faq" id="preguntas"><div><span className="eyebrow">ANTES DE COMPRAR</span><h2>Resolvamos tus dudas.</h2></div><div>{[['¿Qué contiene cada caja?','La página de cada paquete muestra sus productos y cantidades. Revisa la descripción del surtido y consulta con un asesor cualquier detalle de tallas o diseños que no esté especificado.'],['¿El precio incluye el envío?','El envío se cotiza por separado según tu destino, peso y dimensiones. Verás el total antes de realizar el pago.'],['¿Puedo comprar más de un paquete?','Sí. Agrega las cajas a tu carrito y ajusta sus cantidades de acuerdo con la disponibilidad mostrada.'],['¿Necesito registrarme?','No. Puedes comprar como invitado. El carrito muestra las opciones de tarjeta y WhatsApp disponibles.']].map(([q,a])=><details key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></section>
 </main>;
}
