"use client";
import { LiveSummary } from "./live-summary";
import { calculateGroups, pricingKey } from "@/lib/live-pricing";
import type { Package } from "@/lib/catalog";
import Link from "next/link";
import { useContext, useState, useId } from "react";
import {
  Search,
  ShoppingBag,
  UserRound,
  Bot,
  Plus,
  Minus,
  ArrowUpRight,
  Check,
} from "lucide-react";
import { Context } from "./shop";
import type { Original } from "@/lib/product-catalog";
import { money } from "@/lib/money";
import { StorePhoto } from "./store-photo";

function SockVisual({ product }: { product: Original }) {
  const id = useId().replaceAll(":", "");
  const dark = /negro|caballero/i.test(product.name),
    cartoon = /caricatura/i.test(product.name);
  const color = dark ? "#344a43" : cartoon ? "#e4bfbb" : "#fffef8";
  return (
    <svg
      viewBox="0 0 300 210"
      role="img"
      aria-label={`Ilustración de referencia: ${product.name}`}
    >
      <defs>
        <linearGradient id={id} x1="0" x2="1">
          <stop stopColor={color} />
          <stop offset="1" stopColor={dark ? "#172e26" : "#d8d9cf"} />
        </linearGradient>
      </defs>
      <ellipse cx="153" cy="186" rx="79" ry="9" fill="#183c32" opacity=".08" />
      {[0, 1].map((i) => (
        <g
          key={i}
          transform={`translate(${i ? 53 : 0} ${i ? -8 : 6}) rotate(${i ? 12 : -12} 130 105)`}
          opacity={i ? 1 : 0.8}
        >
          <path
            d="M100 32h53v87q0 11 10 16l24 13q15 10 3 24-9 11-25 4l-53-26q-12-6-12-22Z"
            fill={`url(#${id})`}
            stroke="#183c32"
            strokeOpacity=".16"
          />
          <path
            d="M101 38h51M101 45h51M101 52h51"
            stroke={dark ? "#92ae9d" : "#bbc4b8"}
            strokeWidth="2"
            opacity=".65"
          />
          {cartoon ? (
            [75, 106].map((y) => (
              <g key={y} transform={`translate(125 ${y})`}>
                <circle r="10" fill={dark ? "#dfd89d" : "#f7efdc"} />
                <circle cx="-3" cy="-1" r="1.5" fill="#183c32" />
                <circle cx="3" cy="-1" r="1.5" fill="#183c32" />
                <path
                  d="M-4 4q4 4 8 0"
                  fill="none"
                  stroke="#183c32"
                  strokeWidth="1.5"
                />
              </g>
            ))
          ) : (
            <path
              d="M101 62h51M101 69h51"
              stroke={dark ? "#dce8a0" : "#3b6652"}
              strokeWidth="4"
            />
          )}
          <path
            d="M157 141q-10 8-8 18"
            stroke={dark ? "#91ab96" : "#b0bdae"}
            strokeWidth="2"
            fill="none"
            opacity=".5"
          />
        </g>
      ))}
    </svg>
  );
}
export function Originals({
  products,
  packages = [],
}: {
  products: Original[];
  packages?: Package[];
}) {
  const [query, setQuery] = useState("");
  const { lines } = useContext(Context);
  const filtered = products.filter((p) =>
    `${p.name} ${p.pricingGroup || ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="original-toolbar">
        <label className="original-searchbox">
          <Search size={19} />
          <input
            aria-label="Buscar producto"
            placeholder="Busca un producto o colección…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="original-toolbar-actions">
          <span className="original-assistant" title="Merlyn">
            <Bot size={22} />
          </span>
          <Link
            href="/carrito"
            aria-label="Ver mi carrito"
            className="original-bag"
          >
            <ShoppingBag size={21} />
            <span>{lines.reduce((n, l) => n + l.quantity, 0)}</span>
          </Link>
          <details className="original-profile">
            <summary aria-label="Información de tu cuenta">
              <UserRound size={21} />
            </summary>
            <p>
              Compras como invitado. No necesitas una cuenta para preparar tu
              bolsa.
            </p>
          </details>
        </div>
      </div>
      <LiveSummary products={products} packages={packages} />
      <div className="original-results">
        <span>
          {filtered.length} productos <span>· Mayoreo a tu medida</span>
        </span>
        <small>Combina variantes. Ahorra por volumen.</small>
      </div>
      <div className="original-grid">
        {filtered.map((p) => (
          <OriginalCard key={p.id} product={p} products={products} />
        ))}
      </div>
      {!filtered.length && (
        <div className="empty">
          <p>No encontramos productos con esa búsqueda.</p>
          <button onClick={() => setQuery("")}>Limpiar búsqueda</button>
        </div>
      )}
    </>
  );
}
function OriginalCard({
  product: p,
  products,
}: {
  product: Original;
  products: Original[];
}) {
  const { lines, change } = useContext(Context);
  const quantity = lines.find((l) => l.id === -p.id)?.quantity || 0;
  const [amount, setAmount] = useState(1);
  const inputId = useId();
  const max = Math.max(
    0,
    Math.min(p.currentStock - quantity, 100000 - quantity),
  );
  const valid =
    !!p.rules.length &&
    Number.isInteger(amount) &&
    amount >= 1 &&
    amount <= max;
  const group = calculateGroups(products, lines).find(
    (g) => g.key === pricingKey(p),
  );
  const current = group?.rows.find((l) => l.id === -p.id);
  const proposed = calculateGroups(products, [
    ...lines.filter((l) => l.id !== -p.id),
    { id: -p.id, quantity: quantity + (valid ? amount : 0) },
  ]).find((g) => g.key === pricingKey(p));
  const proposedRow = proposed?.rows.find((l) => l.id === -p.id);
  const nextTier = p.rules
    .filter(
      (r) =>
        valid &&
        proposedRow?.price != null &&
        r.minQuantity > (proposed?.quantity || 0) &&
        Number(r.pricePerUnit) < proposedRow.price,
    )
    .sort((a, b) => a.minQuantity - b.minQuantity)[0];
  const prices = p.rules
    .map((r) => Number(r.pricePerUnit))
    .filter(Number.isFinite);
  return (
    <article className="original-product">
      <div className="original-visual">
        <span className="original-watermark">MERLYN / ORIGINALES</span>
        <StorePhoto src={p.imageUrl} name={p.name}><SockVisual product={p} /></StorePhoto>
        <span className={`original-stock ${p.currentStock ? "" : "sold-out"}`}>
          {p.currentStock ? `${p.currentStock} disponibles` : "Agotado"}
        </span>
        <small>Ilustración de referencia</small>
      </div>
      <div className="original-body">
        <div className="original-title">
          <p className="original-meta">
            {[p.gender, p.size].filter(Boolean).join(" · ")}
          </p>
          <span className="product-group-badge">
            Grupo {p.pricingGroup || p.name}
          </span>
          <h2>{p.name}</h2>
        </div>
        <div className="original-price">
          {prices.length ? (
            <>
              <small>Desde</small>
              <strong>{money(Math.min(...prices))}</strong>
              <small>MXN / par</small>
            </>
          ) : (
            <small>Precio por configurar</small>
          )}
        </div>
        <div className="original-current" aria-live="polite">

          {valid && proposedRow?.price != null ? (
            <>
              <b>Pares en carrito {quantity}
                <br></br> Precio por par {money(proposedRow.price)} MXN</b>                    
            </>
          ) : (
            <p>Ingresa una cantidad disponible para calcular.</p>
          )}
          {current?.price != null && (
            <small>
              En el carrito: {quantity} pares × {money(current.price)} = {money((quantity * current.price))}
            </small>
          )}
        </div>
        <div className="original-tiers">
          <table>
            <caption>Tarifa resaltada: vista previa del grupo</caption>
            <thead>
              <tr>
                <th>Pares</th>
                <th>Precio / par</th>
              </tr>
            </thead>
            <tbody>
              {p.rules.map((r, i) => (
                <tr
                  key={i}
                  className={
                    valid &&
                    proposedRow?.price != null &&
                    (proposed?.quantity || 0) >= r.minQuantity &&
                    (r.maxQuantity == null ||
                      (proposed?.quantity || 0) <= r.maxQuantity)
                      ? "tier-applied"
                      : ""
                  }
                >
                  <td>
                    {r.minQuantity}
                    {r.maxQuantity === null ? "+" : `–${r.maxQuantity}`}
                  </td>
                  <td>{money(Number(r.pricePerUnit))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="original-volume">
          {p.pricingGroup ? (
            <>
              Combina variantes de <b>{p.pricingGroup}</b> para alcanzar el
              siguiente precio.
            </>
          ) : (
            "El descuento se calcula con las piezas de este producto."
          )}
        </p>
        <div className="original-purchase">
          <div className="original-quantity-row">
            <label htmlFor={inputId}>
              Cantidad <small>(pares)</small>
            </label>
            <div className="original-stepper">
              <button
                aria-label={`Reducir cantidad de ${p.name}`}
                disabled={amount <= 1}
                onClick={() => setAmount((n) => Math.max(1, n - 1))}
              >
                <Minus size={14} />
              </button>
              <input
                id={inputId}
                type="number"
                min="1"
                max={max || 1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
              <button
                aria-label={`Aumentar cantidad de ${p.name}`}
                disabled={amount >= max}
                onClick={() => setAmount((n) => Math.min(max, n + 1))}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          {valid && proposedRow?.price != null && (
            <div className="card-saving">
              {nextTier ? (
                <>
                  <p>
                    ¡Agrega {nextTier.minQuantity - (proposed?.quantity || 0)}{" "}
                    pares más del grupo <b>{p.pricingGroup || p.name}</b> y
                    ahorra{" "}
                    <b>
                      {money(proposedRow.price - Number(nextTier.pricePerUnit))}{" "}
                      por par de este modelo
                    </b>
                    !
                  </p>
                  <progress
                    value={proposed?.quantity || 0}
                    max={nextTier.minQuantity}
                    aria-label="Progreso hacia la siguiente tarifa"
                  />
                  <small>Después de agregar la cantidad elegida.</small>
                </>
              ) : (
                <p>✓ Mejor tarifa disponible para este modelo.</p>
              )}
            </div>
          )}
          <button
            className="original-add"
            disabled={!valid}
            onClick={() => change(-p.id, quantity + amount)}
          >
            {p.currentStock ? "Agregar a mi carrito" : "Sin disponibilidad"}
            <ArrowUpRight size={17} />
          </button>
          <p className="original-added" role="status">
            {quantity > 0 && (
              <>
                <Check size={13} />
                {quantity} pares en tu carrito
              </>
            )}
          </p>
        </div>
      </div>
    </article>
  );
}
