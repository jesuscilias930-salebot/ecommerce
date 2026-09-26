"use client";

import {Suspense,useEffect,useRef,useState} from 'react';
import {usePathname,useSearchParams} from 'next/navigation';
import styles from './meta-pixel.module.css';
import {MARKETING_CONSENT_KEY} from '@/lib/meta-attribution';
import {isMetaTestMode} from '@/lib/meta-test-mode.mjs';
import Link from 'next/link';

const PIXEL_ID='2294997607982799';
const CONSENT_KEY=MARKETING_CONSENT_KEY;
type Consent='accepted'|'rejected';
type Pixel=((...args:unknown[])=>void)&{callMethod?:(...args:unknown[])=>void;queue:unknown[][];push?:Pixel;loaded:boolean;version:string};
declare global {interface Window {fbq?:Pixel;_fbq?:Pixel;}}
let loading:Promise<void>|undefined;
let initialized=false;
function loadPixel(){
 if(loading)return loading;
 loading=new Promise<void>((resolve,reject)=>{
  if(!window.fbq){
   const fbq=function(...args:unknown[]){if(fbq.callMethod)fbq.callMethod(...args);else fbq.queue.push(args);} as Pixel;
   fbq.queue=[];fbq.loaded=true;fbq.version='2.0';fbq.push=fbq;window.fbq=fbq;window._fbq=fbq;
  }
  const script=document.createElement('script');script.async=true;script.src='https://connect.facebook.net/en_US/fbevents.js';
  script.onload=()=>resolve();script.onerror=()=>{script.remove();loading=undefined;reject(new Error('Pixel unavailable'));};
  document.head.appendChild(script);
 });
 return loading;
}

export function MetaPixel(){
 return <Suspense fallback={null}><MetaPixelContent/></Suspense>;
}
function MetaPixelContent(){
 const pathname=usePathname();
 const search=useSearchParams().toString();
 const exitSearch=new URLSearchParams(search);exitSearch.set('meta_test','0');
 const [testMode,setTestMode]=useState(false);
 const [consent,setConsent]=useState<Consent|null>(null),[ready,setReady]=useState(false),[editing,setEditing]=useState(false);
 const lastPage=useRef<string|null>(null);
 const active=useRef(false);
 useEffect(()=>{const open=()=>setEditing(true);window.addEventListener('merlyn:cookie-preferences',open);return()=>window.removeEventListener('merlyn:cookie-preferences',open);},[]);
 useEffect(()=>{
  try{const saved=localStorage.getItem(CONSENT_KEY);if(saved==='accepted'||saved==='rejected')setConsent(saved);}catch{}
  setReady(true);
 },[]);
 useEffect(()=>{
  const testing=isMetaTestMode();
  setTestMode(testing);
  active.current=consent==='accepted'&&!testing;
  // Never send checkout return URLs, which can contain payment-session identifiers.
  const sensitive=pathname.startsWith('/pago/')||[...new URLSearchParams(window.location.search).keys()].some(k=>/token|session|email|phone|address/i.test(k));
  if(testing||consent!=='accepted'){window.fbq?.('consent','revoke');lastPage.current=null;return;}
  if(sensitive||!['tienda.merlyncilias.com','ecommerce-9w7o.onrender.com'].includes(window.location.hostname))return;
  let cancelled=false;
  void loadPixel().then(()=>{
   if(cancelled||!active.current||isMetaTestMode())return;
   window.fbq?.('consent','grant');
   if(!initialized){
    window.fbq?.('set','autoConfig',false,PIXEL_ID);
    window.fbq?.('init',PIXEL_ID);initialized=true;
   }
   if(lastPage.current!==pathname){window.fbq?.('track','PageView');lastPage.current=pathname;}
  }).catch(()=>{/* Ad blockers or Meta outages must never prevent shopping. */});
  return()=>{cancelled=true;};
 },[consent,pathname,search]);
 function choose(value:Consent){
  active.current=value==='accepted'&&!isMetaTestMode();
  if(!active.current)window.fbq?.('consent','revoke');
  try{localStorage.setItem(CONSENT_KEY,value);}catch{}
  setConsent(value);setEditing(false);
 }
 return <>
  {testMode&&<aside className={styles.testMode} role="status"><strong>Modo de prueba: Meta desactivado</strong><span>No enviamos visitas ni conversiones de nuevos pedidos. Los pagos y pedidos siguen siendo reales si usas producción.</span><a href={`${pathname}?${exitSearch.toString()}`}>Salir del modo de prueba</a></aside>}
  <button type="button" className={styles.settings} onClick={()=>setEditing(true)}>Preferencias de cookies</button>
  {ready&&((!testMode&&consent===null)||editing)&&<section className={styles.banner} aria-label="Cookies publicitarias">
   <div><strong>Tú decides sobre las cookies publicitarias</strong><p>Con tu permiso compartimos con Meta visitas y compras confirmadas, su importe y productos, junto con identificadores publicitarios y el tipo de navegador, para medir anuncios. No compartimos datos de tarjeta, dirección, correo ni teléfono. Puedes rechazarlo y comprar normalmente o cambiar tu elección en Preferencias de cookies antes de iniciar el pago.</p><a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer">Política de privacidad de Meta</a></div>
   <nav aria-label="Privacidad y cookies"><Link href="/privacidad">Aviso de privacidad</Link> · <Link href="/cookies">Política de cookies</Link></nav>
   <div className={styles.actions}><button type="button" onClick={()=>choose('rejected')}>Rechazar</button><button type="button" onClick={()=>choose('accepted')}>Aceptar publicidad</button></div>
  </section>}
 </>;
}
