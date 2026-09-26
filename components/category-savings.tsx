import type {CartQuote} from '@/lib/cart-quote';
import {money} from '@/lib/money';
import styles from './category-savings.module.css';
export function CategorySavings({quote}:{quote:CartQuote}){
 return <section className={styles.panel} aria-label="Precio por categoría">
  <h2>Tus cajas y pares sueltos suman</h2>
  <p>Juntamos los pares de la misma categoría, sin importar el género. El rango alcanzado se aplica a cada modelo, también dentro de las cajas.</p>
  {quote.savings!=null&&quote.savings>0&&<div className={styles.saving} role="status"><strong>Ahorras {money(quote.savings)} al combinar tu pedido</strong><small>Comparado con comprar cada caja por separado y cada modelo individual por separado, con las tarifas actuales. Envío no incluido.</small></div>}
  {quote.groups.map(g=><article key={g.key} className={styles.group}>
   <header><h3>{g.name}</h3><strong>{money(g.subtotal)}</strong></header>
   <div className={styles.equation}><span>{g.bundlePairs} <small>pares en cajas</small></span><b>＋</b><span>{g.individualPairs} <small>pares sueltos</small></span><b>＝</b><strong>{g.quantity} <small>pares para tu tarifa</small></strong></div>
   <details><summary>Ver precio por modelo y de dónde se sumó</summary>
    <ul>{quote.lines.flatMap(l=>l.components.filter(c=>c.categoryKey===g.key).map((c,i)=><li key={`${l.kind}-${l.itemId}-${i}`}><span><b>{c.name}</b><small>{l.kind==='BUNDLE'?`Dentro de ${l.quantity} × ${l.name}`:'Producto individual'} · {c.quantity} pares × {money(c.unitPrice)} / par</small></span><strong>{money(c.subtotal)}</strong></li>))}</ul>
    <p>Rango de {g.quantity} pares aplicado. Cada modelo conserva su propia tabla de precios. Las demás categorías se calculan por separado.</p>
   </details>
  </article>)}
 </section>;
}
