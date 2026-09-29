'use client';
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
 const {lines}=useContext(Context),saved=lines.find(l=>l.id===item.id);
 return <Editor key={`${item.id}:${saved?.quantity||0}:${selectionKey(saved?.selection)}`} item={item} products={products} error={error} saved={saved}/>;
}
function Editor({item,products,error,saved}:{item:Package;products:Original[];error?:string;saved?:CartLine}){
 const {lines,configureBundle}=useContext(Context);
 const [mode,setMode]=useState(saved?.selection?'custom':'assorted');
 const [counts,setCounts]=useState<Record<number,number>>(()=>Object.fromEntries((saved?.selection||[]).map(s=>[s.productId,s.quantity])));
 const [amount,setAmount]=useState(saved?.quantity||1);
 const [added,setAdded]=useState(false);
 const candidates=products.filter(p=>p.categoryId===item.items[0].categoryId).sort((a,b)=>a.id-b.id);
 const genders=[...new Set(candidates.map(p=>p.gender||'Sin género'))];
 const total=item.items.reduce((n,i)=>n+i.quantity,0);
 const selection:Selection=Object.entries(counts).filter(([,n])=>n>0).map(([id,quantity])=>({productId:Number(id),quantity}));
 const selected=selection.reduce((n,s)=>n+s.quantity,0);
 const amountValid=Number.isInteger(amount)&&amount>=1&&amount<=99;
 const valid=amountValid&&(mode==='assorted'||(!error&&selected===total&&selection.length>0&&selection.every(s=>Number.isInteger(s.quantity)&&s.quantity>0&&!!candidates.find(p=>p.id===s.productId))));
 const proposed:CartLine={id:item.id,quantity:amount,...(mode==='assorted'?{}:{selection})};
 const preview=useCartQuote(valid?[...lines.filter(l=>l.id!==item.id),proposed]:[],valid);
 const box=preview.quote?.lines.find(l=>l.kind==='BUNDLE'&&l.itemId===item.id);
 function preset(gender:string){
  let remaining=total;const next:Record<number,number>={};
  for(const p of candidates.filter(p=>(p.gender||'Sin género')===gender)){const n=Math.min(remaining,Math.floor(p.currentStock/Math.max(1,amount)));if(n>0)next[p.id]=n;remaining-=n;}
  setCounts(next);setMode(gender);setAdded(false);
 }
 return <section className={styles.panel} aria-labelledby="choose-box-title">
  <h2 id="choose-box-title">Elige cómo viene tu caja</h2>
  <p>{total} pares por caja. Tú eliges los géneros; los diseños y colores se surten según existencias.</p>
  <fieldset className={styles.options}><legend>Opciones rápidas</legend>
   <button type="button" aria-pressed={mode==='assorted'} onClick={()=>{setMode('assorted');setAdded(false);}}>Surtido</button>
   {genders.map(g=><button type="button" key={g} aria-pressed={mode===g} disabled={!!error||candidates.filter(p=>(p.gender||'Sin género')===g).reduce((n,p)=>n+p.currentStock,0)<total*Math.max(1,amount)} onClick={()=>preset(g)}>{genderName(g)}</button>)}
  </fieldset>
  {mode==='assorted'?<p className={styles.note}>Nosotros preparamos la mezcla de géneros disponibles. No garantiza cantidades por género.</p>:<p className={styles.note}>Tu elección se aplica a cada caja. El precio se calcula con las variantes seleccionadas y todo tu carrito.</p>}
  <button type="button" className={styles.custom} disabled={!!error} aria-expanded={mode==='custom'} onClick={()=>{setMode(mode==='custom'?'assorted':'custom');setAdded(false);}}>Elegir mi combinación</button>
  {error&&<p role="alert">{error} <button type="button" onClick={()=>window.location.reload()}>Reintentar</button></p>}
  {mode==='custom'&&<div className={styles.mix}>
   <p>Reparte los {total} pares como prefieras. Por ejemplo, puedes combinar niña, niño y adulto cuando estén disponibles.</p>
   {genders.map(g=><fieldset key={g}><legend>{genderName(g)}</legend>{candidates.filter(p=>(p.gender||'Sin género')===g).map(p=><label key={p.id}><span>{p.name}{p.size&&<small>Talla: {p.size}</small>}</span><input type="number" min={0} max={total} step={1} inputMode="numeric" aria-label={`Pares de ${p.name} por caja`} value={counts[p.id]||0} onChange={e=>{setCounts(v=>({...v,[p.id]:Math.max(0,Math.min(total,Math.trunc(Number(e.target.value))))}));setAdded(false);}}/></label>)}</fieldset>)}
   {selection.some(s=>!candidates.some(p=>p.id===s.productId))&&<p role="alert">Una variante de tu selección ya no está disponible. <button type="button" onClick={()=>setCounts({})}>Elegir otra combinación</button></p>}
  </div>}
  {mode!=='assorted'&&<div className={styles.progress} role="status"><strong>{selected} de {total} pares por caja</strong><progress max={total} value={Math.min(selected,total)}/><span>{selected===total?'Tu caja está completa':selected<total?`Faltan ${total-selected} pares`:`Quita ${selected-total} pares`}</span></div>}
  <label className={styles.amount}>Cantidad de cajas<input type="number" min={1} max={99} value={amount} onChange={e=>{setAmount(Number(e.target.value));setAdded(false);}}/></label>
  {saved&&<p className={styles.note}>Ya tienes {saved.quantity} {saved.quantity===1?'caja':'cajas'} de este paquete. Al guardar se reemplazarán por esta cantidad y combinación.</p>}
  <div className={styles.price} aria-live="polite">
   {valid?(box?<><strong>{money(box.unitPrice)} por caja</strong><span>{money(box.subtotal)} por {amount} {amount===1?'caja':'cajas'} · IVA incluido, envío aparte.</span>{mode!=='assorted'&&<ul>{box.components.map(c=><li key={c.productId}>{c.perUnitQuantity} pares · {c.name}</li>)}</ul>}</>:preview.quoteError?<><p>{preview.quoteError}</p><button type="button" onClick={preview.retryQuote}>Reintentar precio y existencias</button></>:<p>Verificando precio y existencias…</p>):<p>{!amountValid?'Elige de 1 a 99 cajas.':'Completa los pares para verificar tu precio.'}</p>}
  </div>
  <button type="button" className="primary" disabled={!valid||!box} onClick={()=>{configureBundle(item.id,amount,proposed.selection);setAdded(true);}}>{saved?'Guardar cambios en mi carrito':'Agregar mi caja al carrito'}</button>
  {(added||saved)&&<p role="status"><Link className="text-link" href="/carrito">{added?'Caja guardada. ':''}Revisar mi carrito →</Link></p>}
 </section>;
}
