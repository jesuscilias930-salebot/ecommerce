import Link from 'next/link';
import {Facebook,Instagram} from 'lucide-react';
import {legalLinks} from '@/lib/legal';
import {socialProfiles} from '@/lib/social-profiles';
import styles from './site-footer.module.css';

function SocialIcon({id}:{id:typeof socialProfiles[number]['id']}){
 if(id==='instagram')return <Instagram size={21} aria-hidden="true"/>;
 if(id==='facebook')return <Facebook size={21} aria-hidden="true"/>;
 return <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.3 0 .6.05.88.14V9.4a6.34 6.34 0 0 0-5.63 10.94 6.34 6.34 0 0 0 10.88-4.43V8.94a8.16 8.16 0 0 0 4.77 1.52V7.01a4.8 4.8 0 0 1-.79-.32Z"/></svg>;
}

export function SiteFooter(){return <footer className={styles.root}>
 <div className={styles.brandBlock}>
  <Link className="brand" href="/">merlyn<span>mayoreo</span></Link>
  <p>Pequeños comienzos.<br/>Grandes posibilidades.</p>
 </div>
 <nav className={styles.navigation} aria-label="Explorar la tienda">
  <h2>Explora</h2>
  <Link href="/paquetes">Explorar paquetes</Link>
  <Link href="/ayuda">Ayuda y contacto</Link>
  <Link href="/referencias">Referencias</Link>
  <Link href="/#comunidad">Comunidad</Link>
 </nav>
 <nav className={styles.navigation} aria-label="Información de compra">
  <h2>Tu compra</h2>
  {legalLinks.map(link=><Link key={link.href} href={link.href}>{link.label}</Link>)}
 </nav>
 <nav className={styles.social} aria-label="Redes sociales de Merlyn">
  <h2>Síguenos</h2>
  <p>Conoce más de Merlyn en nuestras redes.</p>
  <ul>{socialProfiles.map(profile=><li key={profile.id}><a href={profile.href} target="_blank" rel="noopener noreferrer" aria-label={`Ver ${profile.name} de Merlyn (abre en otra pestaña)`}><SocialIcon id={profile.id}/><span>{profile.name}</span></a></li>)}</ul>
  <small>Los enlaces abren otra pestaña.</small>
 </nav>
 <small className={styles.copyright}>© {new Date().getFullYear()} Merlyn · Precios en MXN</small>
</footer>;}
