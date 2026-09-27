import type {CartQuote} from '@/lib/cart-quote';
import {money} from '@/lib/money';
import styles from './category-savings.module.css';
export function CategorySavings({quote}:{quote:CartQuote}){
 return <section className={styles.panel} aria-label="Precio por categoría">
  <h2>Tus cajas y productos sueltos suman</h2>
  <p>Caricatura y las demás categorías combinables suman entre géneros. En deportivos y licra solo suman los pares del mismo producto, incluidos los de tus cajas: tin deportivo, calceta deportiva y tin de licra no se mezclan. Shorts caballero con y sin cierre suman entre sí; dama es independiente. Una unidad equivale a un par de calcetines o un short.</p>
  {quote.savings!=null&&quote.savings>0&&<div className={styles.saving} role="status"><strong>Ahorras {money(quote.savings)} al combinar tu pedido</strong><small>Comparado con comprar cada caja por separado y cada modelo individual por separado, con las tarifas actuales. Envío no incluido.</small></div>}
  {quote.groups.map(g=><article key={g.key} className={styles.group}>
   <header><h3>{g.name}</h3><strong>{money(g.subtotal)}</strong></header>
   <div className={styles.equation}><span>{g.bundlePairs} <small>unidades en cajas</small></span><b>＋</b><span>{g.individualPairs} <small>unidades sueltas</small></span><b>＝</b><strong>{g.quantity} <small>unidades para tu tarifa</small></strong></div>
   <details><summary>Ver precio por modelo y de dónde se sumó</summary>
    <ul>{quote.lines.flatMap(l=>l.components.filter(c=>c.categoryKey===g.key).map((c,i)=><li key={`${l.kind}-${l.itemId}-${i}`}><span><b>{c.name}</b><small>{l.kind==='BUNDLE'?`Dentro de ${l.quantity} × ${l.name}`:'Producto individual'} · {c.quantity} unidades × {money(c.unitPrice)} / unidad</small></span><strong>{money(c.subtotal)}</strong></li>))}</ul>
    <p>Rango de {g.quantity} unidades aplicado. Cada modelo conserva su propia tabla de precios. Los demás grupos se calculan por separado.</p>
   </details>
  </article>)}
 </section>;
}
