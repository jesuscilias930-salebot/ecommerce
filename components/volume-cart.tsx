"use client";
import { Checkout } from "./checkout";
import { CartShipping, type ShippingEstimate } from "./cart-shipping";
import { CartQuantity } from "./cart-quantity";
import { useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Context } from "./shop";
import type { Package } from "@/lib/catalog";
import type { Original } from "@/lib/product-catalog";
import { pricingKey, pricingName } from "@/lib/live-pricing";
import { money } from "@/lib/money";
import "./order-cart.css";
type Quote = {
  demo?: boolean;
  lines: {
    productId: number;
    name: string;
    quantity: number;
    groupQuantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  subtotal: number;
};
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
  const { lines, change } = useContext(Context);
  // Never display address collection on the cart, even if a caller passes the wrong prop.
  const pathname = usePathname();
  const showAddress = addressPage && pathname === "/checkout";
  const shippingKey=JSON.stringify({products:lines.filter(l=>l.id<0).map(l=>({productId:-l.id,quantity:l.quantity})),bundles:lines.filter(l=>l.id>0).map(l=>({bundleId:l.id,quantity:l.quantity}))});
  const [shipping,setShipping]=useState<{key:string;estimate:ShippingEstimate|null}|null>(null);
  const estimate=shipping?.key===shippingKey?shipping.estimate:null;
  const key = JSON.stringify(
    lines
      .filter((l) => l.id < 0)
      .map((l) => ({ productId: -l.id, quantity: l.quantity })),
  );
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    quote?: Quote;
    error?: string;
  }>({ key: "" });
  useEffect(() => {
    if (key === "[]") return;
    const c = new AbortController();
    const timer = setTimeout(() => {
      fetch("/api/product-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: key,
        signal: c.signal,
      })
        .then(async (r) => {
          const q = await r.json();
          if (!r.ok) throw new Error(q.error || "No pudimos cotizar");
          const requested = JSON.parse(key) as {
            productId: number;
            quantity: number;
          }[];
          if (
            !Array.isArray(q.lines) ||
            q.lines.length !== requested.length ||
            requested.some((l) => {
              const matches = q.lines.filter(
                (v: Quote["lines"][number]) =>
                  v.productId === l.productId && v.quantity === l.quantity,
              );
              return (
                matches.length !== 1 ||
                ![matches[0].unitPrice, matches[0].subtotal].every(
                  (v) => Number.isFinite(Number(v)) && Number(v) >= 0,
                )
              );
            })
          )
            throw new Error(
              "La cotización está incompleta. Intenta nuevamente.",
            );
          return q as Quote;
        })
        .then((quote) => {
          if (!c.signal.aborted) setResult({ key, quote });
        })
        .catch((e) => {
          if (!c.signal.aborted) setResult({ key, error: e.message });
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      c.abort();
    };
  }, [key, retry]);
  const quote = key !== "[]" && result.key === key ? result.quote : undefined;
  const selected = lines
    .filter((l) => l.id < 0)
    .map((l) => {
      const p = products.find((p) => p.id === -l.id),
        q = quote?.lines.find((q) => q.productId === -l.id);
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
    .map((l) => ({ ...l, item: items.find((p) => p.id === l.id) }));
  const boxesValid = boxes.every(
    (l) => l.item && l.quantity <= l.item.available,
  );
  const productTotal =
    key === "[]"
      ? 0
      : quote
        ? quote.lines.reduce(
            (s, l) => s + Math.round(Number(l.subtotal) * 100),
            0,
          ) / 100
        : null;
  const boxTotal = boxesValid
    ? boxes.reduce(
        (s, l) => s + Math.round(l.item!.price * 100) * l.quantity,
        0,
      ) / 100
    : null;
  const valid = lines.length > 0 && productTotal !== null && boxTotal !== null;
  const total = valid ? productTotal! + boxTotal! : null;
  const demoOrder = !!quote?.demo || (demo && boxes.length > 0);
  const blockedReason=demoOrder?'Modo demostración: los productos ficticios no generan mensajes de compra.':!valid?'Agrega productos y espera una cotización válida para continuar.':undefined;
  const quantityControl = (id: number, quantity: number, max: number) => (
    <CartQuantity quantity={quantity} max={max} unit={id<0?"pares":"cajas"} name={(id<0?selected.find(l=>l.id===id)?.name:boxes.find(l=>l.id===id)?.item?.name)||"Artículo no disponible"} onChange={n=>change(id,n)}/>
  );
  return (
    <div className="cart-layout order-cart">
      <section className="order-main" aria-label={addressPage ? "Dirección y envío" : "Artículos del carrito"}>
        {!addressPage && lines.length > 0 && <div className="order-toolbar"><p>{lines.length} {lines.length === 1 ? "artículo" : "artículos"} en tu pedido <small>El precio por volumen se actualiza al cambiar cantidades.</small></p><Link href="/productos">Seguir comprando ↗</Link></div>}
        {error && <p className="order-notice" role="alert">{error}</p>}
        {!lines.length && <div className="empty"><h2>Tu bolsa está vacía</h2><p>Encuentra los productos para tu próximo pedido.</p><Link className="primary" href="/productos">Explorar productos</Link></div>}
        {key !== "[]" && !quote && <div className="order-notice" role="status">
          {result.key === key && result.error ? <>{result.error}<button onClick={() => { setResult({key: ""}); setRetry(n => n + 1); }}>Reintentar</button></> : "Actualizando precios y existencias…"}
        </div>}
        {!addressPage && groups.map(g => <article className="order-group" key={g.key}>
          <header><div><span className="order-kind">Precio por volumen</span><h2>{g.name}</h2></div><span className="order-badge">{g.quantity} pares</span></header>
          {g.members.map(l => <div className="order-product" key={l.id}>
            <div className="order-item-top">
              <div className="order-thumb">{l.product?.imageUrl ? <img src={l.product.imageUrl} alt="" /> : <span aria-hidden="true">◈</span>}</div>
              <div className="order-item-info"><h3>{l.name}</h3><p>{l.q ? money(Number(l.q.unitPrice)) : "Calculando…"} / par</p></div>
              <strong className="order-item-price">{l.q ? money(Number(l.q.subtotal)) : "—"}</strong>
            </div>
            {quantityControl(l.id, l.quantity, l.product?.currentStock ?? 0)}
          </div>)}
          <div className="order-group-total"><span>Total del grupo · {g.quantity} pares</span><b>{g.total === null ? "Calculando…" : money(g.total)}</b></div>
        </article>)}
        {!addressPage && boxes.map(l => <article className="order-group" key={l.id}>
          <div className="order-item-top">
            <div className="order-thumb">{l.item?.imageUrl ? <img src={l.item.imageUrl} alt="" /> : <span aria-hidden="true">▣</span>}</div>
            <div className="order-item-info"><span className="order-kind">Paquete para emprender</span><h3>{l.item?.name || "Caja no disponible"}</h3><p>{l.item ? money(l.item.price) : "Por confirmar"} / caja</p></div>
            <strong className="order-item-price">{l.item ? money(l.item.price * l.quantity) : "—"}</strong>
          </div>
          {quantityControl(l.id, l.quantity, l.item?.available ?? 0)}
          {l.item && l.quantity > l.item.available && <p role="alert">Solo hay {l.item.available} cajas disponibles. Ajusta la cantidad.</p>}
          {l.item && <details className="order-contents"><summary>Ver qué incluye · {l.item.pieces * l.quantity} pares en total</summary><ul>{l.item.items.map((item, index) => <li key={item.id ?? index}><span>{item.name}</span><b>{item.quantity * l.quantity} pares</b></li>)}</ul><p>Contenido de {l.quantity} {l.quantity === 1 ? "caja" : "cajas"}. Todo está incluido en el precio del paquete.</p></details>}
        </article>)}
        {showAddress && lines.length > 0 && <CartShipping key={shippingKey} cartKey={shippingKey} blocked={blockedReason} onSelect={estimate => setShipping({key: shippingKey, estimate})}/>}
      </section>
      {lines.length > 0 && <aside className="order-summary">
        <span className="order-kind">Tu compra, en resumen</span><h2>Resumen del pedido</h2>
        {demoOrder && <p role="status">Demostración: estos artículos no generan pedidos reales.</p>}
        <details className="summary-items"><summary>{lines.length} {lines.length === 1 ? "artículo" : "artículos"} · Ver detalle</summary>
          <ul>{selected.map(l => <li key={l.id}><span>{l.quantity} pares · {l.name}</span><b>{l.q ? money(Number(l.q.subtotal)) : "—"}</b></li>)}{boxes.map(l => <li key={l.id}><span>{l.quantity} × {l.item?.name || "Caja no disponible"}</span><b>{l.item ? money(l.item.price * l.quantity) : "—"}</b></li>)}</ul>
        </details>
        <div><span>Productos</span><b>{total === null ? "Calculando…" : money(total)}</b></div>
        <div><span>Envío</span><span>{addressPage ? estimate ? money(estimate.price) : "Elige una tarifa" : "En el siguiente paso"}</span></div>
        <div className="order-final" aria-live="polite"><span>{estimate ? "Total a pagar" : "Subtotal"}</span><b>{total === null ? "—" : money((Math.round(total * 100) + Math.round((estimate?.price || 0) * 100)) / 100)}<small> MXN</small></b></div>
        <p className="summary-caption">Impuestos incluidos.{estimate?.test ? " Envío de prueba." : ""}</p>
        <Checkout addressPage={addressPage} shipping={estimate} blockedReason={blockedReason}/>
        <Link href={addressPage ? "/carrito" : "/paquetes"}>{addressPage ? "← Editar mi pedido" : "＋ Explorar paquetes para emprender"}</Link>
      </aside>}
    </div>
  );
}
