import Link from "next/link";
import {customizable,type Selection} from '@/lib/bundle-selection';
import type { Package } from "@/lib/catalog";
import type { CartQuoteLine } from "@/lib/cart-quote";
import { money } from "@/lib/money";
import { CartQuantity } from "./cart-quantity";

export function CartBundle({ id, quantity,selection, item, quote, availabilityUnknown = false, onChange }: {
  id: number;
  quantity: number;
  selection?:Selection;
  item?: Package;
  quote?: CartQuoteLine;
  availabilityUnknown?: boolean;
  onChange: (quantity: number) => void;
}) {
  const name = quote?.name || item?.name || (availabilityUnknown ? `Paquete #${id} · pendiente de verificar` : "Paquete no disponible");
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
    {item&&customizable(item)&&<p className="cart-selection-label">{selection?'Géneros personalizados':'Surtido según existencias'}</p>}
    <CartQuantity name={name} quantity={quantity} max={availabilityUnknown?null:item?.available ?? 0} unit="cajas" onChange={onChange}/>
  </article>;
}
