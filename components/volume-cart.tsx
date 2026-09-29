"use client";
import {cartInput} from '@/lib/cart-quote';
import { Checkout } from "./checkout";
import { CartShipping, type ShippingEstimate } from "./cart-shipping";
import { CartQuantity } from "./cart-quantity";
import { CartBundle } from "./cart-bundle";
import { useContext, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Context } from "./shop";
import type { Package } from "@/lib/catalog";
import type { Original } from "@/lib/product-catalog";
import { pricingKey, pricingName } from "@/lib/live-pricing";
import { money } from "@/lib/money";
import "./order-cart.css";
export function VolumeCart({
  items,
  products = [],
  demo,
  error,
  addressPage = false,
}: {
  items: Package[];
  products?: Original[];
  demo: boolean;
  error?: string;
  addressPage?: boolean;
}) {
  const { lines, change, quote, quoteError, retryQuote } = useContext(Context);
  const router=useRouter();
  const [refreshing,startRefresh]=useTransition();
  // Never display address collection on the cart, even if a caller passes the wrong prop.
  const pathname = usePathname();
  const showAddress = addressPage && pathname === "/checkout";
  const shippingKey=JSON.stringify(cartInput(lines));
  const [shipping,setShipping]=useState<{key:string;estimate:ShippingEstimate|null}|null>(null);
  const estimate=shipping?.key===shippingKey?shipping.estimate:null;
  const selected = lines
    .filter((l) => l.id < 0)
    .map((l) => {
      const p = products.find((p) => p.id === -l.id),
        q = quote?.lines.find((q) => q.kind === "PRODUCT" && q.itemId === -l.id);
      return {
        ...l,
        product: p,
        q,
        group: p ? pricingKey(p) : `product:${-l.id}`,
        name: p?.name || q?.name || `Producto ${-l.id}`,
      };
    });
  const groups = [...new Set(selected.map((l) => l.group))].map((key) => {
    const members = selected.filter((l) => l.group === key);
    return {
      key,
      name: members[0].product ? pricingName(members[0].product) : members[0].name,
      members,
      quantity: members.reduce((s, l) => s + l.quantity, 0),
      total: members.every((l) => l.q)
        ? members.reduce(
            (s, l) => s + Math.round(Number(l.q!.subtotal) * 100),
            0,
          ) / 100
        : null,
    };
  });
  const boxes = lines
    .filter((l) => l.id > 0)
    .map((l) => ({ ...l, item: items.find((p) => p.id === l.id), q: quote?.lines.find(q=>q.kind==="BUNDLE"&&q.itemId===l.id) }));
  const valid = lines.length > 0 && !!quote && !error;
  const total = valid ? Number(quote!.subtotal) : null;
  const demoOrder = !!quote?.demo || (demo && boxes.length > 0);
  const blockedReason=error?'Reintenta la carga del catálogo para verificar existencias antes de continuar.':demoOrder?'Modo demostración: los productos ficticios no generan mensajes de compra.':!valid?'Agrega productos y espera una cotización válida para continuar.':undefined;
  const quantityControl = (id: number, quantity: number, max: number|null) => (
    <CartQuantity quantity={quantity} max={max} unit={id<0?"unidades":"cajas"} name={(id<0?selected.find(l=>l.id===id)?.name:boxes.find(l=>l.id===id)?.item?.name)||"Artículo no disponible"} onChange={n=>change(id,n)}/>
  );
  return (
    <div className="cart-layout order-cart">
      <section className="order-main" aria-label={addressPage ? "Dirección y envío" : "Artículos del carrito"}>
        {!addressPage && lines.length > 0 && <div className="order-toolbar"><p>{lines.length} {lines.length === 1 ? "artículo" : "artículos"} en tu pedido <small>El precio por volumen se actualiza al cambiar cantidades.</small></p><Link href="/productos">Seguir comprando ↗</Link></div>}
        {error && <div className="order-notice" role="alert"><p>{error} Tu carrito se conserva; esto no significa que tus artículos estén agotados.</p><button type="button" disabled={refreshing} onClick={()=>{startRefresh(()=>router.refresh());retryQuote();}}>{refreshing?'Verificando…':'Reintentar carga'}</button></div>}
        {!lines.length && <div className="empty"><h2>Tu bolsa está vacía</h2><p>Encuentra los productos para tu próximo pedido.</p><Link className="primary" href="/productos">Explorar productos</Link></div>}
        {lines.length > 0 && !quote && <div className="order-notice" role="status">
          {quoteError ? <>{quoteError}<button onClick={retryQuote}>Reintentar</button></> : "Actualizando precios y existencias…"}
        </div>}
        {!addressPage && boxes.length > 0 && <div className="cart-section-heading"><h2>Tus paquetes</h2><p>Cada tarjeta es un paquete completo. Cambia la cantidad de cajas para ajustar todo su contenido.</p></div>}
        {!addressPage && boxes.map(l => <CartBundle key={l.id} id={l.id} quantity={l.quantity} selection={l.selection} item={l.item} quote={l.q} products={products} availabilityUnknown={!!error} onChange={quantity => change(l.id, quantity)}/>)}
        {!addressPage && groups.length > 0 && <div className="cart-section-heading"><h2>Tus productos individuales</h2><p>Estos artículos se agregaron por separado y no forman parte de los paquetes de arriba.</p></div>}
        {!addressPage && groups.map(g => <article className="order-group" key={g.key}>
          <header><div><span className="order-kind">Productos individuales</span><h2>{g.name}</h2></div><span className="order-badge">{g.quantity} unidades</span></header>
          {g.members.map(l => <div className="order-product" key={l.id}>
            <div className="order-item-top">
              <div className="order-thumb">{l.product?.imageUrl ? <img src={l.product.imageUrl} alt="" /> : <span aria-hidden="true">◈</span>}</div>
              <div className="order-item-info"><h3>{l.name}</h3><p>{l.q ? money(Number(l.q.unitPrice)) : "Calculando…"} / par</p></div>
              <strong className="order-item-price">{l.q ? money(Number(l.q.subtotal)) : "—"}</strong>
            </div>
            {quantityControl(l.id, l.quantity, error?null:l.product?.currentStock ?? 0)}
          </div>)}
          <div className="order-group-total"><span>Individuales de este grupo · {g.quantity} unidades</span><b>{g.total === null ? "Calculando…" : money(g.total)}</b></div>
        </article>)}
        {showAddress && lines.length > 0 && <CartShipping key={shippingKey} cartKey={shippingKey} blocked={blockedReason} onSelect={estimate => setShipping({key: shippingKey, estimate})}/>}
      </section>
      {lines.length > 0 && <aside className="order-summary">
        <span className="order-kind">Tu compra, en resumen</span><h2>Resumen del pedido</h2>
        {demoOrder && <p role="status">Demostración: estos artículos no generan pedidos reales.</p>}
        <details className="summary-items"><summary>{lines.length} {lines.length === 1 ? "artículo" : "artículos"} · Ver detalle</summary>
          <ul>{selected.map(l => <li key={l.id}><span>{l.quantity} unidades · {l.name}</span><b>{l.q ? money(Number(l.q.subtotal)) : "—"}</b></li>)}{boxes.map(l => <li key={l.id}><span>{l.quantity} × {l.item?.name || "Caja no disponible"}</span><b>{l.q ? money(l.q.subtotal) : "—"}</b></li>)}</ul>
        </details>
        <div><span>Cajas e individuales · {quote?.totalPairs ?? "—"} unidades</span><b>{total === null ? "Calculando…" : money(total)}</b></div>
        <div><span>Envío</span><span>{addressPage ? estimate ? money(estimate.price) : "Elige una tarifa" : "En el siguiente paso"}</span></div>
        {quote?.savings!=null&&quote.savings>0&&<div><span>Ahorro al combinar (ya incluido)</span><b>−{money(quote.savings)}</b></div>}
        <div className="order-final" aria-live="polite"><span>{estimate ? "Total a pagar" : "Subtotal"}</span><b>{total === null ? "—" : money((Math.round(total * 100) + Math.round((estimate?.price || 0) * 100)) / 100)}<small> MXN</small></b></div>
        <p className="summary-caption">Impuestos incluidos.{estimate?.test ? " Envío de prueba." : ""}</p>
        <Checkout addressPage={addressPage} shipping={estimate} blockedReason={blockedReason}/>
        <Link href={addressPage ? "/carrito" : "/paquetes"}>{addressPage ? "← Editar mi pedido" : "＋ Explorar paquetes para emprender"}</Link>
      </aside>}
    </div>
  );
}
