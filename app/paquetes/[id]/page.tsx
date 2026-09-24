import {PurchaseConfidence} from '@/components/store-trust';
import {BundleDescription} from '@/components/bundle-description';
import {BundleContent} from '@/components/bundle-content';
import './breakdown.css';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getCatalog} from '@/lib/catalog';
import {money} from '@/lib/money';
import {AddButton} from '@/components/shop';
import {BoxArt} from '@/components/box-art';
import {StorePhoto} from '@/components/store-photo';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;const data=await getCatalog();if(data.error)return <main id="contenido" className="section"><p role="alert">{data.error}</p><Link href="/paquetes">Volver al catálogo</Link></main>;const item=data.packages.find(p=>String(p.id)===id);if(!item)notFound();return <main id="contenido" className="section">{data.demo&&<p className="demo">Paquete de demostración · Contenido y precio ilustrativos</p>}<Link className="text-link" href="/paquetes">← Todos los paquetes</Link><div className="detail"><StorePhoto zoom images={item.imageUrls} src={item.imageUrl} name={item.name}><BoxArt tone={item.tone} large/></StorePhoto><section><span className="eyebrow">LISTO PARA TU SIGUIENTE COMIENZO</span><h1>{item.name}</h1><BundleDescription text={item.description}/><p className="detail-price">{money(item.price)} <small>MXN</small></p><p>{item.pieces} piezas · {money(item.price/item.pieces)} por pieza</p><p className="stock">{item.available?`${item.available} cajas disponibles`:'Temporalmente agotado'}</p><BundleContent item={item}/><p className="fine-print">La imagen es ilustrativa. Confirma tallas, colores y surtido antes de comprar. Envío cotizado por separado.</p><AddButton item={item}/><PurchaseConfidence bundleId={item.id}/></section></div></main>}
