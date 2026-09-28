import Link from "next/link";
import type { Package } from "@/lib/catalog";
import type { CartQuoteLine } from "@/lib/cart-quote";
import { money } from "@/lib/money";
import { CartQuantity } from "./cart-quantity";
import { bundlePresentation, isShort, triparesLabel, usesTripares } from "@/lib/sale-presentation";
import type { Original } from "@/lib/product-catalog";

export function CartBundle({ id, quantity, item, quote, products = [], availabilityUnknown = false, onChange }: {
  id: number;
  quantity: number;
  item?: Package;
  quote?: CartQuoteLine;
  products?: Original[];
  availabilityUnknown?: boolean;
  onChange: (quantity: number) => void;
}) {
  const name = quote?.name || item?.name || (availabilityUnknown ? `Paquete #${id} · pendiente de verificar` : "Paquete no disponible");
  const contents = quote?.components.length
    ? quote.components.map((part, index) => ({
        key: `${part.productId}-${index}`, name: part.name,
        quantity: part.quantity, perBox: part.perUnitQuantity,
        presentation: products.find(product => product.id === part.productId) || {name: part.name, category: part.categoryName},
      }))
    : (item?.items || []).map((part, index) => ({
        key: `${part.id ?? index}`, name: part.name,
        quantity: part.quantity * quantity, perBox: part.quantity,
        presentation: products.find(product => product.id === part.productId) || {name: part.name, category: part.category},
      }));
  const units = contents.reduce((sum, part) => sum + part.quantity, 0);
  const presentation = bundlePresentation(contents.map(part => ({quantity: part.quantity, tripares: usesTripares(part.presentation)})));
  const hasTripares = contents.some(part => usesTripares(part.presentation));
  return <article className="order-group cart-bundle" aria-label={`Paquete: ${name}`}>
    <div className="order-item-top">
      <Link href={`/paquetes/${id}`} className="order-thumb" aria-label={`Ver ${name}`}>
        {item?.imageUrl ? <img src={item.imageUrl} alt="" /> : <span aria-hidden="true">▣</span>}
      </Link>
      <div className="order-item-info">
        <span className="order-kind">Paquete completo · {quantity} {quantity === 1 ? "caja" : "cajas"}</span>
        <h3><Link href={`/paquetes/${id}`}>{name}</Link></h3>
        <p>{quote ? money(quote.unitPrice) : "Calculando…"} por caja</p>
      </div>
      <div className="cart-bundle-total"><small>Total del paquete</small><strong>{quote ? money(quote.subtotal) : "—"}</strong></div>
    </div>
    <div className="cart-bundle-contents">
      <h4>Todo esto viene en tu paquete</h4>
      <p>{units > 0 ? `${units} unidades en ${quantity === 1 ? "esta caja" : `estas ${quantity} cajas`}. ` : ""}No son productos comprados por separado.</p>
      {presentation && <div className="cart-tripar-summary"><strong>{units} pares de calcetines</strong><span>Presentación: {presentation}</span></div>}
      {contents.length > 0 ? <ul>{contents.map(part => <li key={part.key}>
        <span>{part.name}{quantity > 1 && <small>{part.perBox} {isShort(part.presentation) ? 'piezas' : 'pares'} por caja{usesTripares(part.presentation) ? ` (${triparesLabel(part.perBox)})` : ''} × {quantity} cajas</small>}</span>
        <b className="cart-content-quantity">{part.quantity} <small>{isShort(part.presentation) ? 'piezas' : 'pares'}</small>{usesTripares(part.presentation) && <span className="cart-tripar-label">{triparesLabel(part.quantity)}</span>}</b>
      </li>)}</ul> : <p>El contenido no está disponible en este momento.</p>}
      <small>Una unidad equivale a un par de calcetines o a un short. Todo el contenido está incluido en el total de arriba.</small>
      {hasTripares && <p className="cart-tripar-help">1 tripar = 3 pares de calcetines. Es la presentación de los pares indicados, no una cantidad adicional.</p>}
    </div>
    <CartQuantity name={name} quantity={quantity} max={availabilityUnknown?null:item?.available ?? 0} unit="cajas" onChange={onChange}/>
    {quote?.savings != null && quote.savings > 0 && <p className="cart-line-saving">Ahorras {money(quote.savings)} en este paquete con el volumen de tu pedido. Ya incluido en el total.</p>}
    {!!quote?.components.length && <details className="order-contents">
      <summary>Ver precios aplicados dentro del paquete</summary>
      <ul>{quote.components.map((part, index) => <li key={`${part.productId}-${index}`}><span>{part.name}<small className="cart-component-rate">{part.quantity} unidades × {money(part.unitPrice)}</small></span><b>{money(part.subtotal)}</b></li>)}</ul>
      <p>Este desglose explica el total del paquete; no son cargos adicionales.</p>
    </details>}
  </article>;
}
