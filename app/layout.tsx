import {MetaPixel} from '@/components/meta-pixel';
import type {Metadata} from 'next';
import Link from 'next/link';
import {legalLinks} from '@/lib/legal';
import {Header,ShopProvider} from '@/components/shop';
import './globals.css';
import './originals.css';
import './responsive.css';
export const metadata:Metadata={title:{default:'Merlyn · Tu negocio empieza aquí',template:'%s | Merlyn Mayoreo'},description:'Explora paquetes de mayoreo para emprender. Compara presupuestos, conoce el contenido y prepara tu pedido.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="es-MX"><body><ShopProvider><a className="skip" href="#contenido">Saltar al contenido</a><Header/>{children}<footer><Link className="brand" href="/">merlyn<span>mayoreo</span></Link><p>Pequeños comienzos. Grandes posibilidades.</p><div><Link href="/paquetes">Explorar paquetes</Link><Link href="/ayuda">Ayuda y contacto</Link><Link href="/referencias">Referencias</Link><Link href="/#comunidad">Comunidad</Link>{legalLinks.map(l=><Link key={l.href} href={l.href}>{l.label}</Link>)}</div><small>© {new Date().getFullYear()} Merlyn · Precios en MXN</small></footer><MetaPixel/></ShopProvider></body></html>}
