'use client';
import Link from 'next/link';
import type { Package } from '@/lib/catalog';
import { money } from '@/lib/money';
import styles from './shopping-discovery.module.css';

export function BundleComparison({items,onRemove,onClear}:{items:Package[];onRemove:(id:number)=>void;onClear:()=>void}) {
  if (!items.length) return null;
  return <section className={styles.comparison} id="comparar-paquetes" aria-labelledby="comparison-title">
    <header><div><h2 id="comparison-title">Compara tu inversión</h2><p>Hasta 3 paquetes. Mismos datos del catálogo, lado a lado.</p></div><button type="button" onClick={onClear}>Limpiar comparación</button></header>
    {items.length === 1 && <p role="status">Selecciona otro paquete para ver las diferencias.</p>}
    <div className={styles.tableScroll} role="region" aria-label="Comparación de paquetes" tabIndex={0}>
      <table><caption>Precios en MXN con IVA. El envío se cotiza aparte antes del pago.</caption>
        <thead><tr><th scope="col">Qué vas a recibir</th>{items.map(item=><th key={item.id} scope="col"><Link href={`/paquetes/${item.id}`}>{item.name}</Link><button type="button" aria-label={`Quitar ${item.name} de la comparación`} onClick={()=>onRemove(item.id)}>Quitar ×</button></th>)}</tr></thead>
        <tbody>
          <tr><th scope="row">Precio de la caja</th>{items.map(item=><td key={item.id}><strong>{money(item.price)}</strong></td>)}</tr>
          <tr><th scope="row">Pares incluidos</th>{items.map(item=><td key={item.id}>{item.pieces}</td>)}</tr>
          <tr><th scope="row">Costo promedio / par</th>{items.map(item=><td key={item.id}>{item.pieces>0?money(item.price/item.pieces):'No disponible'}</td>)}</tr>
          <tr><th scope="row">Contenido</th>{items.map(item=><td key={item.id}><ul>{item.items.map((row,index)=><li key={index}>{row.quantity} pares · {row.name}</li>)}</ul></td>)}</tr>
          <tr><th scope="row">Existencias</th>{items.map(item=><td key={item.id}>{item.available>0?`${item.available} cajas`:'Agotado'}</td>)}</tr>
          <tr><th scope="row">Siguiente paso</th>{items.map(item=><td key={item.id}><Link className="primary" href={`/paquetes/${item.id}`}>Ver paquete</Link></td>)}</tr>
        </tbody>
      </table>
    </div>
  </section>;
}
