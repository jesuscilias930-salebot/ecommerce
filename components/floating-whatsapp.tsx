"use client";
import {MessageCircle} from 'lucide-react';
import {storeWhatsappHref,type StoreFeatures} from '@/lib/store-feature-values';
import styles from './floating-whatsapp.module.css';

export function FloatingWhatsapp({features}:{features:StoreFeatures}) {
 const href=storeWhatsappHref(features);
 if(!href)return null;
 return <a className={styles.button} href={href} target="_blank" rel="noopener noreferrer" aria-label="Comprar por WhatsApp (abre en otra pestaña)">
  <MessageCircle size={21} aria-hidden="true"/><span>Comprar por WhatsApp</span>
 </a>;
}
