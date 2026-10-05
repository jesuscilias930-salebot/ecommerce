"use client";
import {QuantityInput} from './quantity-input';
import "./volume-pricing.css";
import { calculateGroups, pricingKey, pricingName } from "@/lib/live-pricing";
import {CategoryPricing} from './category-pricing';
import type { Package } from "@/lib/catalog";
import Link from "next/link";
import { useContext, useState, useId, useEffect } from "react";
import { matchesSearch } from '@/lib/shopping-discovery';
import {
  Search,
  ShoppingBag,
  UserRound,
  Bot,
  Plus,
  Minus,
  ArrowUpRight,
} from "lucide-react";
import { Context } from "./shop";
import type { Original } from "@/lib/product-catalog";
import { money } from "@/lib/money";
import { StorePhoto } from "./store-photo";
import { groupByCategory } from "@/lib/product-categories";
import categoryStyles from "./product-categories.module.css";
import {PurchaseReferences} from './testimonial-gallery';
import {cartCount} from '@/lib/bundle-selection';
import {fixedPairsInCart} from '@/lib/price-preview';
import {ProductViewEvent} from './product-view-event';
import {salePackSize,saleUnit,saleUnits,saleUnitPrice,saleQuantityLabel} from '@/lib/sale-presentation';

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
  initialQuery = '',
  references = [],
}: {
  products: Original[];
  packages?: Package[];
  initialQuery?: string;
  references?: {id:number;url:string}[];
}) {
  const [query, setQuery] = useState(initialQuery);
  useEffect(()=>setQuery(initialQuery),[initialQuery]);
  const { lines } = useContext(Context);
  const filtered = products.filter((p) =>
    matchesSearch(`${p.name} ${p.category || ""} ${p.pricingGroup || ""} ${p.gender || ''}`,query),
  );
  const categories = groupByCategory(filtered);
  const allCategories = groupByCategory(products);
  const groups = calculateGroups(products, lines, packages);
  const categoryId = (key:string) => `products-${Array.from(key,c=>c.codePointAt(0)!.toString(16)).join('-')}`;
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
            <span>{cartCount(lines)}</span>
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
      <div className="original-results">
        <span>
          {filtered.length} productos <span>· Mayoreo a tu medida</span>
        </span>
        <small>1. Elige cantidades · 2. Agrega al carrito · 3. Consulta tu tarifa</small>
      </div>
      {categories.length>1&&<nav className={categoryStyles.navigation} aria-label="Ir a una categoría">
        {categories.map(category=><a key={category.key} href={`#${categoryId(category.key)}`}>{category.label}<span>{category.products.length}</span></a>)}
      </nav>}
      {categories.map(category=><section className={categoryStyles.section} key={category.key} id={categoryId(category.key)} aria-labelledby={`${categoryId(category.key)}-title`}>
        <header className={categoryStyles.header}><h2 id={`${categoryId(category.key)}-title`}>{category.label}</h2><span>{category.products.length} {category.products.length===1?'producto':'productos'}</span></header>
        <div className="category-shopping-layout">
        <CategoryPricing label={category.label} products={allCategories.find(group=>group.key===category.key)?.products||category.products} groups={groups} incomplete={lines.some(line=>line.id>0&&!packages.some(item=>item.id===line.id))}/>
        <div className="original-grid">{category.products.map(p=><OriginalCard key={p.id} product={p} products={products} packages={packages}/>)}</div>
        </div>
      </section>)}
      {!filtered.length && (
        <div className="empty">
          <p>No encontramos productos con esa búsqueda.</p>
          <button onClick={() => setQuery("")}>Limpiar búsqueda</button>
        </div>
      )}
      <section className="shared-references">{references.length?<PurchaseReferences photos={references}/>:<Link href="/referencias">Consultar referencias de clientes →</Link>}</section>
    </>
  );
}
function OriginalCard({
  product: p,
  products,
  packages = [],
}: {
  product: Original;
  products: Original[];
  packages?: Package[];
}) {
  const { lines, change } = useContext(Context);
  const quantity = lines.find((l) => l.id === -p.id)?.quantity || 0;
  const packSize = salePackSize(p);
  const unit = saleUnit(p);
  const units = saleUnits(p);
  const [amount, setAmount] = useState(1);
  const pairAmount = amount * packSize;
  const removeQuantity=Math.min(quantity,(Number.isInteger(amount)&&amount>0?amount:1)*packSize);
  const inputId = useId();
  const max = Math.max(
    0,
    Math.floor(Math.min(p.currentStock - fixedPairsInCart(p.id,lines,packages), 100000 - quantity) / packSize),
  );
  const valid =
    !lines.some(line=>line.id>0&&!packages.some(item=>item.id===line.id)) &&
    !!p.rules.length &&
    quantity % packSize === 0 &&
    Number.isInteger(amount) &&
    amount >= 1 &&
    amount <= max;
  const group = calculateGroups(products, lines, packages).find(
    (g) => g.key === pricingKey(p),
  );
  const current = group?.rows.find((l) => l.id === -p.id);
  const proposed = calculateGroups(products, [
    ...lines.filter((l) => l.id !== -p.id),
    { id: -p.id, quantity: quantity + (valid ? pairAmount : 0) },
  ], packages).find((g) => g.key === pricingKey(p));
  const proposedRow = proposed?.rows.find((l) => l.id === -p.id);
  return (
    <article className="original-product">
      <div className="original-visual">
        <span className="original-watermark">MERLYN / ORIGINALES</span>
        <StorePhoto images={p.imageUrls} src={p.imageUrl} name={p.name}><SockVisual product={p} /></StorePhoto>
        <span className={`original-stock ${Math.floor(p.currentStock/packSize) ? "" : "sold-out"}`}>
          {Math.floor(p.currentStock/packSize) ? `${Math.floor(p.currentStock/packSize)} ${units} disponibles` : "Agotado"}
        </span>
        {!p.imageUrl&&!p.imageUrls?.length&&<small>Ilustración de referencia</small>}
      </div>
      <div className="original-body">
        <div className="original-title">
          <ProductViewEvent id={p.id} kind="product"/>
          <p className="original-meta">
            {[p.gender, p.details?.sizeRange||p.size].filter(Boolean).join(" · ")}
          </p>
          <span className="product-group-badge">
            Grupo {pricingName(p)}
          </span>
          <h2>{p.name}</h2>
          {packSize===3&&<p><strong>1 tripar = 3 pares</strong> · Se vende en juegos de 3 pares.</p>}
        </div>
        <div className="original-price">
          {valid&&proposedRow?.price!=null ? (
            <>
              <small>Tu precio al agregar</small>
              <strong>{money(saleUnitPrice(proposedRow.price,p))}</strong>
              <small>MXN / {unit}</small>
            </>
          ) : (
            <small>Elige una cantidad disponible para calcular</small>
          )}
        </div>
        <div className="original-current" aria-live="polite">

          {valid && proposedRow?.price != null ? (
            <>
              <b>{saleQuantityLabel(pairAmount,p)} por agregar · Subtotal {money(Math.round(proposedRow.price*100)*pairAmount/100)}</b><small>IVA incluido · Envío aparte. Vista previa con tu carrito; verificamos antes de pagar.</small>
            </>
          ) : (
            <p>Ingresa una cantidad disponible para calcular.</p>
          )}
          {current?.price != null && (
            <small>
              En el carrito: {saleQuantityLabel(quantity,p)} · Total {money(Math.round(current.price*100)*quantity/100)}
            </small>
          )}
        </div>
        <details className="original-tiers"><summary>Ver detalles del producto</summary>
          <dl><dt>Talla del producto</dt><dd>{p.details?.sizeRange||p.size||'Rango pendiente de confirmar; consulta antes de comprar.'}</dd>{p.details?.material&&<><dt>Material</dt><dd>{p.details.material}</dd></>}{p.details?.height&&<><dt>Altura</dt><dd>{p.details.height}</dd></>}</dl>
        {p.details?.assortment&&<p>{p.details.assortment}</p>}
        </details>
        <div className="original-purchase">
          <div className="original-quantity-row">
            <label htmlFor={inputId}>
              Cantidad <small>({units})</small>
            </label>
            <div className="original-stepper">
              <button
                aria-label={`Reducir cantidad de ${p.name}`}
                disabled={amount <= 1}
                onClick={() => setAmount((n) => Math.max(1, n - 1))}
              >
                <Minus size={14} />
              </button>
              <QuantityInput
                id={inputId}
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
          {quantity>0&&<div className="original-cart-adjust"><span>{saleQuantityLabel(quantity,p)} en el carrito</span><button type="button" aria-label={`Quitar ${saleQuantityLabel(removeQuantity,p)} de ${p.name} del carrito`} onClick={()=>change(-p.id,quantity-removeQuantity)}>Quitar {saleQuantityLabel(removeQuantity,p)}</button><button type="button" onClick={()=>change(-p.id,0)} aria-label={`Quitar todos los ${p.name} individuales del carrito`}>Quitar todos</button></div>}
          {quantity%packSize!==0&&<p role="alert">Este artículo de tu carrito anterior tiene pares sueltos. Quítalo y agrégalo de nuevo en tripares completos.</p>}
          <button
            className="original-add"
            disabled={!valid||proposedRow?.price==null}
            onClick={() => change(-p.id, quantity + pairAmount)}
          >
            {Math.floor(p.currentStock/packSize) ? "Agregar a mi carrito" : "Sin disponibilidad"}
            <ArrowUpRight size={17} />
          </button>
          {!valid&&<p role="status">{max<1?'Sin existencias adicionales para agregar.':`Escribe entre 1 y ${max} ${units}.`}</p>}
        </div>
      </div>
    </article>
  );
}
