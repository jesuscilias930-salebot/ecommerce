"use client";
import {storeWhatsappHref,type StoreFeatures} from '@/lib/store-feature-values';
import styles from './floating-whatsapp.module.css';

export function FloatingWhatsapp({features}:{features:StoreFeatures}) {
 const href=storeWhatsappHref(features);
 if(!href)return null;
 return <a className={styles.button} href={href} target="_blank" rel="noopener noreferrer" aria-label="Comprar por WhatsApp (abre en otra pestaña)">
  <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
   <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .16 5.34 .16 11.9c0 2.1.55 4.15 1.59 5.95L.06 24l6.31-1.65a11.9 11.9 0 0 0 5.69 1.45h.01C18.63 23.8 24 18.46 24 11.9a11.8 11.8 0 0 0-3.48-8.42ZM12.07 21.8a9.88 9.88 0 0 1-5.03-1.38l-.36-.21-3.75.98 1-3.65-.24-.38a9.88 9.88 0 0 1-1.52-5.26C2.17 6.45 6.6 2 12.07 2a9.83 9.83 0 0 1 7.04 2.92A9.84 9.84 0 0 1 22 11.91c0 5.46-4.46 9.89-9.93 9.89Z"/>
   <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.35.19 1.86.11.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z"/>
  </svg><span>Comprar por WhatsApp</span>
 </a>;
}
