"use client";
import Link from "next/link";
import "./volume-drawer.css";
import {useContext,useRef} from "react";
import {Context} from "./shop";
import type {Original} from "@/lib/product-catalog";
import type {Package} from "@/lib/catalog";
import {money} from "@/lib/money";
import {CategorySavings} from "./category-savings";
export function LiveSummary(_props:{products:Original[];packages?:Package[]}){
 const drawer=useRef<HTMLDialogElement>(null);
 const {lines,quote,quoteError,retryQuote}=useContext(Context);
 return <>
  <div className="volume-launcher"><div aria-live="polite"><span>{quote?quote.totalPairs+" pares en tu pedido":lines.length?"Actualizando tu pedido…":"Tu bolsa está vacía"}</span><strong>{quote?money(quote.subtotal):lines.length?"Calculando…":money(0)} MXN</strong><small>Impuestos incluidos · envío aparte</small></div><button className="primary" onClick={()=>drawer.current?.showModal()}>Ver desglose por categoría →</button></div>
  <dialog ref={drawer} className="volume-drawer" aria-label="Tu bolsa por categorías" onClick={e=>{if(e.target===e.currentTarget)drawer.current?.close();}}>
   <button className="drawer-close" onClick={()=>drawer.current?.close()} aria-label="Cerrar desglose">Cerrar ✕</button>
   <section className="live-summary"><h2>Así va tu bolsa</h2>
    {!lines.length&&<p>Agrega cajas o pares individuales para ver aquí el precio de todo tu pedido.</p>}
    {lines.length>0&&!quote&&<p role="status">{quoteError||"Actualizando precios y existencias…"}{quoteError&&<button onClick={retryQuote}>Reintentar</button>}</p>}
    {quote&&<><CategorySavings quote={quote}/><details><summary>Ver total de cada artículo</summary>{quote.lines.map(l=><p key={l.kind+l.itemId}>{l.quantity} {l.kind==="BUNDLE"?"cajas":"pares"} · {l.name} <b>{money(l.subtotal)}</b></p>)}</details><div className="live-total" aria-live="polite"><div><span>{quote.totalPairs} pares · Subtotal del pedido</span><strong>{money(quote.subtotal)} MXN</strong><small>Impuestos incluidos. Envío en el siguiente paso.</small></div></div></>}
    <Link className="primary" href="/carrito" onClick={()=>drawer.current?.close()}>Editar cantidades y continuar →</Link>
    <p><small>Si quitas pares, la tarifa puede subir al cambiar de rango.</small></p>
   </section>
  </dialog>
 </>;
}
