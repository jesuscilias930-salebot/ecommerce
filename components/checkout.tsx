'use client';
import {checkoutAttribution} from '@/lib/meta-attribution';
import {useContext,useEffect,useRef,useState} from 'react';
import {Context} from './shop';
import {money} from '@/lib/money';
import {ShippingAddress,validateAddress} from '@/lib/shipping-address';
import type {ShippingEstimate} from './cart-shipping';
import {useRouter} from 'next/navigation';
import Link from 'next/link';

type Receipt={body:string;folio:string;whatsappUrl:string;subtotal:number};
const STORAGE_KEY='merlyn-pending-checkout-v1';
export function Checkout({blockedReason,addressPage=false,shipping}:{blockedReason?:string;addressPage?:boolean;shipping?:ShippingEstimate|null}) {
 const router=useRouter();
 const [cardPaymentsEnabled,setCardPaymentsEnabled]=useState(false);
 useEffect(()=>{
  let active=true;
  let controller:AbortController|undefined;
  const refresh=async()=>{
   controller?.abort(); controller=new AbortController();
   try {
    const response=await fetch('/api/store-features',{cache:'no-store',signal:controller.signal});
    const data=response.ok?await response.json():null;
    if(active)setCardPaymentsEnabled(data?.cardPaymentsEnabled===true);
   } catch(e) {if(active&&!(e instanceof Error&&e.name==='AbortError'))setCardPaymentsEnabled(false);}
  };
  void refresh(); window.addEventListener('focus',refresh);
  return ()=>{active=false;controller?.abort();window.removeEventListener('focus',refresh);};
 },[]);
 const {lines}=useContext(Context);
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const [receipt,setReceipt]=useState<Receipt|null>(null);
 const attempt=useRef({body:'',id:''});
 const lock=useRef(false);
 const body=JSON.stringify({
  products:lines.filter(l=>l.id<0).map(l=>({productId:-l.id,quantity:l.quantity})).sort((a,b)=>a.productId-b.productId),
  bundles:lines.filter(l=>l.id>0).map(l=>({bundleId:l.id,quantity:l.quantity})).sort((a,b)=>a.bundleId-b.bundleId)
 });
 const current=receipt?.body===body?receipt:null;
 async function complete(payment: 'stripe' | 'whatsapp' = 'whatsapp') {
  if(payment==='stripe'&&!cardPaymentsEnabled)return;
  if(lock.current||blockedReason||!lines.length)return;
  if(current&&payment==='whatsapp'){window.location.assign(current.whatsappUrl);return;}
  lock.current=true;setBusy(true);setError('');
  try {
   // A WhatsApp fallback must keep the same order after an ambiguous Stripe attempt.
   let previous=attempt.current;
   try{if(!previous.id)previous=JSON.parse(sessionStorage.getItem(STORAGE_KEY)||'null')||previous;}catch{}
   let previousAddress:ShippingAddress|undefined;
   let previousToken:string|undefined;
   try{const p=JSON.parse(previous.body);if(JSON.stringify({products:p.products,bundles:p.bundles})===body&&p.shippingAddress){previousAddress=validateAddress(p.shippingAddress);previousToken=typeof p.shippingQuoteToken==='string'?p.shippingQuoteToken:undefined;}}catch{}
   if(payment==='stripe'&&(!shipping||Date.parse(shipping.expiresAt)<=Date.now()))throw Error('Selecciona una tarifa vigente antes de pagar.');
   const fallback=payment==='whatsapp'&&previousAddress;
   const shippingAddress=fallback?previousAddress:shipping?validateAddress(shipping.address):previousAddress;
   const shippingQuoteToken=fallback?previousToken:shipping?.token;
   const orderBody=JSON.stringify({...JSON.parse(body),...(shippingAddress?{shippingAddress}:{}),...(shippingQuoteToken?{shippingQuoteToken}:{})});
   if(attempt.current.body!==orderBody){
    let saved:{body?:string;id?:string}|null=null;
    try{saved=JSON.parse(sessionStorage.getItem(STORAGE_KEY)||'null');}catch{}
    const id=saved?.body===orderBody&&typeof saved.id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(saved.id)?saved.id:crypto.randomUUID();
    attempt.current={body:orderBody,id};
   }
   try{sessionStorage.setItem(STORAGE_KEY,JSON.stringify(attempt.current));}catch{}
   const response=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...JSON.parse(orderBody),requestId:attempt.current.id,payment,marketing:payment==='stripe'?checkoutAttribution():undefined}),signal:AbortSignal.timeout(25000)});
   const data=await response.json();
   if(!response.ok)throw Error(data.error||'No se pudo registrar el pedido.');
   if(payment==='stripe'){
    if(data.folio!=='MS-'+attempt.current.id.toLowerCase()||typeof data.sessionId!=='string'||!/^cs_(test|live)_[A-Za-z0-9]+$/.test(data.sessionId))throw Error('Respuesta de pago inválida.');
    if(data.checkoutUrl){const checkout=new URL(data.checkoutUrl);if(checkout.protocol!=='https:'||checkout.hostname!=='checkout.stripe.com')throw Error('URL de pago inválida.');window.location.assign(checkout.href);}
    else window.location.assign('/pago/resultado?session_id='+encodeURIComponent(data.sessionId));
    return;
   }
   const url=new URL(data.whatsappUrl);
   if(url.protocol!=='https:'||url.hostname!=='wa.me'||url.pathname!=='/522721285563'||data.folio!=='MS-'+attempt.current.id.toLowerCase())throw Error('Respuesta de pedido inválida.');
   setReceipt({body,folio:data.folio,whatsappUrl:url.href,subtotal:Number(data.subtotal)});
   window.location.assign(url.href);
  }catch(e){setError(e instanceof Error&&e.name!=='TimeoutError'?e.message:'La respuesta tardó demasiado. Reintenta: se usará el mismo identificador.');}
  finally{lock.current=false;setBusy(false);}
 }
 return <section aria-label="Concluir pedido" className="checkout-actions">
  <small>Antes de concluir, consulta los <Link href="/terminos">términos de compra</Link>, la <Link href="/envios-y-devoluciones">política de envíos y devoluciones</Link> y el <Link href="/privacidad">aviso de privacidad</Link>. Aceptar publicidad es opcional.</small>
  {cardPaymentsEnabled&&!addressPage&&<><button type="button" className="primary" disabled={busy||!!blockedReason||!lines.length} onClick={()=>router.push('/checkout')}>Pagar ahora · Completar dirección →</button><small>En el siguiente paso eliges dónde recibirlo y cuánto cuesta el envío. Sin crear una cuenta.</small></>}
  {cardPaymentsEnabled&&addressPage&&<><p className="checkout-explanation">{shipping?'Dirección y envío listos. Revisa tu total antes de continuar.':'Completa tu dirección y elige un envío para continuar.'}</p><button type="button" className="primary" disabled={busy||!!blockedReason||!lines.length||!shipping} onClick={()=>void complete('stripe')}>{busy?'Preparando pago…':'Continuar al pago seguro →'}</button><small>El pago se confirma en Stripe. Todavía no se realizará ningún cargo.</small></>}
  {cardPaymentsEnabled&&<span className="checkout-or">o</span>}
  <button type="button" className={cardPaymentsEnabled?'checkout-secondary':'primary'} disabled={busy||!!blockedReason||!lines.length} onClick={()=>void complete()}>{busy?'Procesando…':current?'Abrir WhatsApp con mi pedido':'Concluir pedido por WhatsApp'}</button>
  {current&&<div role="status"><b style={{overflowWrap:'anywhere'}}>Pedido registrado: {current.folio}</b><p>Subtotal registrado: {money(current.subtotal)} MXN.</p><a href={current.whatsappUrl}>Si WhatsApp no abrió, pulsa aquí</a></div>}
  {blockedReason&&<small role="status">{blockedReason}</small>}
  {error&&<p role="alert">{error}</p>}
 </section>;
}
