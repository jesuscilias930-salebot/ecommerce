'use client';
import {QuantityInput} from './quantity-input';
import {useContext,useState} from 'react';
import Link from 'next/link';
import {Context} from './shop';
import {useCartQuote} from './use-cart-quote';
import type {Package} from '@/lib/catalog';
import type {Original} from '@/lib/product-catalog';
import {selectionKey,type CartLine,type Selection} from '@/lib/bundle-selection';
import {money} from '@/lib/money';
import styles from './bundle-configurator.module.css';

const genderName=(gender:string)=>({Hombre:'Caballero',Mujer:'Dama'}[gender]||gender);
export function BundleConfigurator({item,products,error}:{item:Package;products:Original[];error?:string}){
 const {lines}=useContext(Context),saved=lines.find(l=>l.id===item.id&&l.selection)||lines.find(l=>l.id===item.id);
 return <Editor key={`${item.id}:${saved?.quantity||0}:${selectionKey(saved?.selection)}`} item={item} products={products} error={error} saved={saved}/>;
}
function Editor({item,products,error,saved}:{item:Package;products:Original[];error?:string;saved?:CartLine}){
 const {lines,configureBundle}=useContext(Context);
 const [mode,setMode]=useState(saved&&!saved.selection?'assorted':'custom');
 const [counts,setCounts]=useState<Record<number,number>>(()=>Object.fromEntries((saved?.selection||[]).map(s=>[s.productId,s.quantity])));
 const [amount,setAmount]=useState(saved?.quantity||1);
 const [added,setAdded]=useState(false);
 const candidates=products.filter(p=>p.categoryId===item.items[0].categoryId).sort((a,b)=>a.id-b.id);
 const total=item.items.reduce((n,i)=>n+i.quantity,0);
 const selection:Selection=Object.entries(counts).filter(([,n])=>n>0).map(([id,quantity])=>({productId:Number(id),quantity}));
 const selected=selection.reduce((n,s)=>n+s.quantity,0);
 const amountValid=Number.isInteger(amount)&&amount>=1&&amount<=99;
 const valid=amountValid&&(mode==='assorted'||(!error&&selected===total&&selection.length>0&&selection.every(s=>Number.isInteger(s.quantity)&&s.quantity>0&&!!candidates.find(p=>p.id===s.productId))));
 const proposed:CartLine={id:item.id,quantity:amount,...(mode==='assorted'?{}:{selection})};
 const preview=useCartQuote(valid?[...lines.filter(l=>l.id!==item.id||!!l.selection!==!!proposed.selection),proposed]:[],valid);
 const box=preview.quote?.lines.find(l=>l.kind==='BUNDLE'&&l.itemId===item.id&&selectionKey(l.selection??undefined)===selectionKey(proposed.selection));
 function updateCount(id:number,value:number){
  setCounts(v=>({...v,[id]:Number.isFinite(value)?Math.max(0,Math.min(total,Math.trunc(value))):0}));
  setMode('custom');setAdded(false);
 }
 return <section className={styles.panel} aria-labelledby="choose-box-title">
  <div className={styles.price} aria-live="polite">
   <strong>{money(valid&&box?box.unitPrice:item.price)} <small>MXN / caja</small></strong>
   <span>{valid&&box?'Precio con tu carrito':'Precio de referencia'} · IVA incluido · Envío aparte</span>
  </div>
  <h2 id="choose-box-title">Personalizar géneros</h2>
  <p>Elige cómo repartir tus {total} pares o deja que armemos tu surtido.</p>
  <label className={styles.assorted}><input type="checkbox" checked={mode==='assorted'} onChange={e=>{setMode(e.target.checked?'assorted':'custom');setCounts({});setAdded(false);}}/>Quiero mi pedido surtido</label>
  {error&&<p role="alert">{error} <button type="button" onClick={()=>window.location.reload()}>Reintentar</button></p>}
  <div className={styles.mix}>
   {candidates.map(p=>{const label=`${genderName(p.gender||'Sin género')}${p.size?` · ${p.size}`:''}`;return <div className={styles.row} key={p.id}>
    <label htmlFor={`gender-${item.id}-${p.id}`}>{label}</label>
    <div className={styles.stepper}>
     <button type="button" aria-label={`Quitar un par de ${label}`} disabled={mode==='assorted'||!!error||!(counts[p.id]>0)} onClick={()=>updateCount(p.id,(counts[p.id]||0)-1)}>−</button>
     <QuantityInput id={`gender-${item.id}-${p.id}`} disabled={mode==='assorted'||!!error} min={0} max={total} placeholder="—" aria-label={`Pares de ${label} por caja`} value={mode==='assorted'?'':counts[p.id]||0} onChange={e=>updateCount(p.id,Number(e.target.value))}/>
     <button type="button" aria-label={`Agregar un par de ${label}`} disabled={mode==='assorted'||!!error||selected>=total} onClick={()=>updateCount(p.id,(counts[p.id]||0)+1)}>+</button>
    </div>
   </div>;})}
   {selection.some(s=>!candidates.some(p=>p.id===s.productId))&&<p role="alert">Una variante de tu selección ya no está disponible. <button type="button" onClick={()=>setCounts({})}>Elegir otra combinación</button></p>}
  </div>
  {mode==='assorted'?<p className={styles.note} role="status">Surtido automático · {total} pares. Nosotros elegimos la mezcla.</p>:<div className={styles.progress} role="status"><strong>{selected} de {total} pares · {selected===total?'Caja completa':selected<total?`Faltan ${total-selected}`:`Quita ${selected-total}`}</strong><progress max={total} value={Math.min(selected,total)}/><button type="button" className={styles.reset} onClick={()=>{setMode('assorted');setCounts({});setAdded(false);}}>Restablecer a surtido</button></div>}
  <label className={styles.amount}>Cantidad de cajas<QuantityInput min={1} max={99} value={amount} onChange={e=>{setAmount(Number(e.target.value));setAdded(false);}}/></label>
  {saved&&<p className={styles.note}>Guardar actualiza las cajas de esta modalidad. Las surtidas y las personalizadas se conservan por separado.</p>}
  <div className={styles.status} aria-live="polite">
   {valid?(box?(amount>1?<p>Total de {amount} cajas: <strong>{money(box.subtotal)}</strong></p>:null):preview.quoteError?<><p>{preview.quoteError}</p><button type="button" onClick={preview.retryQuote}>Reintentar precio y existencias</button></>:<p>Verificando precio y existencias…</p>):!amountValid?<p>Elige de 1 a 99 cajas.</p>:null}
  </div>
  <button type="button" className="primary" disabled={!valid||!box} onClick={()=>{configureBundle(item.id,amount,proposed.selection);setAdded(true);}}>{saved?'Guardar cambios en mi carrito':mode==='assorted'?'Agregar caja surtida al carrito':'Agregar caja personalizada al carrito'}</button>
  {(added||saved)&&<p role="status"><Link className="text-link" href="/carrito">{added?'Caja guardada. ':''}Revisar mi carrito →</Link></p>}
 </section>;
}
