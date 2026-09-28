import {TestimonialPhotos} from '@/components/testimonial-photos';
import Link from 'next/link';
import {PackageCheck,MessageCircle,Truck,ArrowUpRight} from 'lucide-react';
import {COMMUNITY_URL,SUPPORT_URL,publishedReferences,type CustomerReference} from '@/lib/store-trust';
import styles from './store-trust.module.css';
import {StorePhoto} from './store-photo';
import {BoxArt} from './box-art';

export function ReferenceCard({reference:r}:{reference:CustomerReference}){return <figure className={styles.card}>
  {/* eslint-disable-next-line @next/next/no-img-element */}
  {r.photoUrl&&<img src={r.photoUrl} alt={r.photoAlt||'Fotografía compartida por un cliente'} loading="lazy"/>}
  <blockquote>“{r.quote}”</blockquote><figcaption>{r.publicName}{r.city&&` · ${r.city}`}{r.date&&` · ${r.date}`}</figcaption>
</figure>;}
export function ContactLink({children='Consultar con un asesor'}:{children?:React.ReactNode}){return SUPPORT_URL?<a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">{children} ↗</a>:<Link href="/ayuda#contacto">Ayuda para tu compra →</Link>;}
export function TrustSection(){return <section className="section" aria-labelledby="trust-title"><span className="eyebrow">COMPRA CON INFORMACIÓN CLARA</span><h2 id="trust-title">Conoce lo que vas a recibir.</h2><p className={styles.intro}>Elegir mercancía para tu negocio es una decisión importante. Revisa el contenido, consulta el envío y resuelve tus dudas antes de pagar.</p><div className={styles.grid}>
  <article className={styles.card}><span className={styles.icon}><PackageCheck aria-hidden="true"/></span><h3>Contenido desglosado</h3><p>Cada paquete muestra los productos y sus cantidades. Consulta tallas, colores y surtido antes de confirmar.</p><Link href="/paquetes">Explorar paquetes →</Link></article>
  <article className={styles.card}><span className={styles.icon}><Truck aria-hidden="true"/></span><h3>Envío según tu destino</h3><p>Consulta las opciones y el costo antes de pagar. La preparación del pedido es distinta al tiempo de traslado.</p><Link href="/ayuda#envios">Sobre los envíos →</Link></article>
  <article className={styles.card}><span className={styles.icon}><MessageCircle aria-hidden="true"/></span><h3>Resuelve tus dudas</h3><p>Consulta los detalles antes de comprar. No necesitas entrar a un grupo ni crear una cuenta para preparar tu pedido.</p><ContactLink/></article>
</div></section>;}
export function CustomerReferences(){const references=publishedReferences();return <section className="section" id="referencias"><TestimonialPhotos limit={3}/><span className="eyebrow">EXPERIENCIAS DE COMPRA</span><h2>{references.length?'Clientes que ya recibieron su pedido.':'¿Quieres conocer referencias antes de comprar?'}</h2>{references.length?<><p className={styles.intro}>Testimonios y fotografías publicados con autorización de sus autores.</p><div className={styles.grid}>{references.slice(0,3).map(r=><ReferenceCard key={r.id} reference={r}/>)}</div></>:<p className={styles.intro}>Consulta cómo solicitar referencias y resolver tus dudas sobre los paquetes.</p>}<div className={styles.links}><Link href="/referencias">{references.length?'Ver todas las referencias':'Consultar referencias'} →</Link></div></section>;}
export function CommunitySection({productPhoto}:{productPhoto?:{url:string;name:string}}){return <section className="section" id="comunidad" aria-labelledby="community-title">
 <div className={styles.community}>
  <figure className={styles.communityPhoto}>
   <StorePhoto src={productPhoto?.url} name={productPhoto?`Nuestros productos: ${productPhoto.name}`:'Merlyn Mayoreo'}><BoxArt tone={1}/></StorePhoto>
   <figcaption>{productPhoto?'Una muestra de nuestros productos':'Calcetines para emprender y resurtir'}</figcaption>
  </figure>
  <div className={styles.communityCopy}>
   <span className="eyebrow">DETRÁS DE TU PEDIDO</span>
   <h2 id="community-title">Conoce a quien está detrás de Merlyn.</h2>
   <p>Soy Merlyn. Si tienes dudas sobre nuestros calcetines o quieres personalizar tu pedido, puedes escribirme. También te invito a conocer nuestra comunidad de WhatsApp.</p>
   <div className={styles.communityActions}>
    <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer"><MessageCircle size={20} aria-hidden="true"/>Hablar con Merlyn <ArrowUpRight size={18} aria-hidden="true"/></a>
    <a className={styles.communitySecondary} href={COMMUNITY_URL} target="_blank" rel="noopener noreferrer">Conocer la comunidad <ArrowUpRight size={18} aria-hidden="true"/></a>
   </div>
   <small>No necesitas entrar al grupo para comprar. Los enlaces abren WhatsApp en otra pestaña. Al unirte al grupo, tu número puede ser visible para otros participantes.</small>
  </div>
 </div>
</section>;}
export function PurchaseConfidence(){return <aside className={styles.compact} aria-label="Consulta con un asesor"><p>Si tienes dudas o deseas personalizar tu pedido, consulta a un asesor:</p>{SUPPORT_URL?<a className={styles.advisorButton} href={SUPPORT_URL} target="_blank" rel="noopener noreferrer"><MessageCircle size={20} aria-hidden="true"/>Escribir por WhatsApp <ArrowUpRight size={18} aria-hidden="true"/></a>:<Link className={styles.advisorButton} href="/ayuda#contacto">Contactar a un asesor</Link>}</aside>;}
