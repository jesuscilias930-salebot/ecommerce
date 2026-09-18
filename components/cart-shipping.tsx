'use client';
import {useEffect,useRef,useState} from 'react';
import {emptyAddress,addressLimits,ShippingAddress,validateAddress} from '@/lib/shipping-address';
import {money} from '@/lib/money';
import {ShippingAddressForm} from './shipping-address-form';
import styles from './cart-shipping.module.css';
import {useRouter} from 'next/navigation';

type Rate={carrier:string;service:string;description:string;deliveryEstimate:string;totalPrice:number;currency:string;token:string};
type Quote={environment:'sandbox'|'production';rates:Rate[];expiresAt:string;parcel:{pairs:number;weightKg:number;lengthCm:number;widthCm:number;heightCm:number}};
export type ShippingEstimate={price:number;test:boolean;expiresAt:string;token:string;address:ShippingAddress;carrier:string;service:string};
const selectionKey='merlyn-shipping-selection-v1';
const draftKey='merlyn-shipping-draft-v1';
export function CartShipping({cartKey,blocked,onSelect}:{cartKey:string;blocked?:string;onSelect:(quote:ShippingEstimate|null)=>void}){
 const router=useRouter();
 const [address,setAddress]=useState<ShippingAddress>({...emptyAddress});
 const [open,setOpen]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [quote,setQuote]=useState<Quote|null>(null),[selected,setSelected]=useState(-1);
 const abort=useRef<AbortController|null>(null);
 const callback=useRef(onSelect);callback.current=onSelect;
 useEffect(()=>{
  // Restore incomplete drafts too: changing quantities remounts this component.
  // Full validation still happens before requesting a shipping quote.
  try{
   const raw=sessionStorage.getItem(draftKey);const saved=raw?JSON.parse(raw):null;
   if(saved&&typeof saved==='object'&&!Array.isArray(saved)){
    const draft={...emptyAddress};
    for(const key of Object.keys(draft) as (keyof ShippingAddress)[])if(typeof saved[key]==='string')draft[key]=saved[key].slice(0,addressLimits[key]);
    draft.country='MX';setAddress(draft);
   }
  }catch{/* Invalid stored data must not prevent showing the form. */}
  try{
   const saved=JSON.parse(sessionStorage.getItem(selectionKey)||'null');
   if(saved?.cartKey===cartKey&&Date.parse(saved.quote?.expiresAt)>Date.now()&&saved.quote?.rates?.[saved.selected]?.token){
    const destination=validateAddress(saved.address),rate=saved.quote.rates[saved.selected];
    setAddress(destination);setQuote(saved.quote);setSelected(saved.selected);setOpen(false);
    callback.current({price:Number(rate.totalPrice),test:saved.quote.environment==='sandbox',expiresAt:saved.quote.expiresAt,token:rate.token,address:destination,carrier:rate.carrier,service:rate.service});
   }else sessionStorage.removeItem(selectionKey);
  }catch{/* Storage may be unavailable; the customer can quote again. */}
  return()=>abort.current?.abort();
 },[]);
 useEffect(()=>{
  if(!quote)return;
  const timer=setTimeout(()=>{setQuote(null);setSelected(-1);callback.current(null);setError('La cotización venció. Calcula nuevamente para actualizar el precio.');},Math.max(0,Date.parse(quote.expiresAt)-Date.now()));
  return()=>clearTimeout(timer);
 },[quote]);
 function edit(value:ShippingAddress){if(JSON.stringify(value)===JSON.stringify(address))return;setAddress(value);setQuote(null);setSelected(-1);callback.current(null);setError('');try{sessionStorage.removeItem(selectionKey);sessionStorage.setItem(draftKey,JSON.stringify(value));}catch{}}
 async function calculate(){
  if(busy||blocked)return;
  setError('');setQuote(null);setSelected(-1);callback.current(null);
  try{sessionStorage.removeItem(selectionKey);}catch{}
  try{
   const destination=validateAddress(address);
   abort.current?.abort();const controller=new AbortController();abort.current=controller;
   setBusy(true);
   const response=await fetch('/api/shipping-quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...JSON.parse(cartKey),destination}),signal:controller.signal});
   const data=await response.json();
   if(!response.ok)throw Error(data.error||'No pudimos cotizar el envío.');
   if(!['sandbox','production'].includes(data.environment)||!Array.isArray(data.rates)||!data.rates.length||!Number.isFinite(Date.parse(data.expiresAt))||Date.parse(data.expiresAt)<=Date.now()||data.rates.some((r:Rate)=>typeof r.token!=='string'||!r.token||r.currency!=='MXN'||!Number.isFinite(Number(r.totalPrice))||Number(r.totalPrice)<=0))throw Error('No recibimos tarifas válidas. Intenta nuevamente.');
   if(controller.signal.aborted)return;
   setQuote(data);setOpen(false);
  }catch(e){if(e instanceof Error&&e.name!=='AbortError'){setError(e.message);setOpen(true);}}finally{setBusy(false);}
 }
 function choose(index:number){if(!quote||Date.parse(quote.expiresAt)<=Date.now())return;const rate=quote.rates[index];if(!rate.token)return;setSelected(index);onSelect({price:Number(rate.totalPrice),test:quote.environment==='sandbox',expiresAt:quote.expiresAt,token:rate.token,address,carrier:rate.carrier,service:rate.service});try{sessionStorage.setItem(selectionKey,JSON.stringify({cartKey,quote,selected:index,address}));}catch{}}
 return <section className={styles.card} aria-labelledby="cart-shipping-title">
  <h2 id="cart-shipping-title">{open?'Tu dirección de entrega':'Elige cómo recibirlo'}</h2>
  {blocked&&<p role="status" className={styles.notice}>{blocked} Puedes completar tu dirección mientras tanto.</p>}
   {!open&&<div className={styles.destination}><div><strong>{address.recipient}</strong><p>{address.street} {address.exteriorNumber}{address.interiorNumber?` · Interior ${address.interiorNumber}`:''}<br/>{address.district}, {address.city} · CP {address.postalCode}</p></div><button type="button" disabled={busy} onClick={()=>setOpen(true)} aria-expanded={open} aria-controls="cart-shipping-address">Editar dirección</button></div>}
   <div id="cart-shipping-address" hidden={!open}><ShippingAddressForm quoteMode value={address} onChange={edit} onContinue={()=>void calculate()} onBack={()=>router.push('/carrito')} busy={busy} blocked={!!blocked}/></div>
   {!open&&!quote&&address.postalCode&&<button className="primary" disabled={busy||!!blocked} type="button" onClick={()=>void calculate()}>{busy?'Consultando paqueterías…':'Volver a consultar envíos'}</button>}
  {error&&<p role="alert" className={styles.error}>{error}</p>}
  {busy&&<p role="status">Estamos consultando las paqueterías disponibles. Puede tardar unos segundos.</p>}
  {quote&&!open&&<>
   {quote.environment==='sandbox'&&<p className={styles.notice}>Cotización de prueba de Envia.com. No es una tarifa de producción.</p>}
   <fieldset className={styles.rates}><legend>Opciones de envío</legend><p>Selecciona una opción. Su precio se sumará al total de tu pedido.</p>
    {quote.rates.map((r,i)=><label key={`${r.carrier}-${r.service}-${i}`} className={selected===i?styles.selected:undefined}>
     <input type="radio" name="shipping-rate" checked={selected===i} onChange={()=>choose(i)}/>
     <span><strong>{r.carrier} · {r.description||r.service}</strong><small>{r.deliveryEstimate||'Entrega por confirmar'}</small>{i===0&&<small>Menor precio disponible</small>}</span><b>{money(Number(r.totalPrice))} MXN</b>
    </label>)}
   </fieldset>
   <small>Precio válido durante 10 minutos. Si editas tu pedido o dirección, volveremos a cotizar.</small>
  </>}
 </section>;
}
