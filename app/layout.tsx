import {MetaPixel} from '@/components/meta-pixel';
import type {Metadata} from 'next';
import {SiteFooter} from '@/components/site-footer';
import {Header,ShopProvider} from '@/components/shop';
import './globals.css';
import './originals.css';
import './responsive.css';
import './wholesale-clarity.css';
import './theme.css';
export const metadata:Metadata={title:{default:'Merlyn · Tu negocio empieza aquí',template:'%s | Merlyn Mayoreo'},description:'Explora paquetes de mayoreo para emprender. Compara presupuestos, conoce el contenido y prepara tu pedido.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="es-MX"><body><ShopProvider><a className="skip" href="#contenido">Saltar al contenido</a><Header/>{children}<SiteFooter/><MetaPixel/></ShopProvider></body></html>}
