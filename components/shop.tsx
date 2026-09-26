"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, useTransition, useCallback } from "react";
import {useCartQuote} from './use-cart-quote';
import type {CartQuote} from '@/lib/cart-quote';
import {completedCart,CHECKOUT_ATTEMPT_KEY} from '@/lib/completed-cart';
import {
  ShoppingBag,
  ArrowUpRight,
  ArrowRight,
  Minus,
  Plus,
  X,
  PackageCheck,
  Search,
  Menu,
} from "lucide-react";
import type { Package } from "@/lib/catalog";
import { money } from "@/lib/money";
import { BoxArt } from "./box-art";
import { StorePhoto } from "./store-photo";
import { BundleDescription } from "./bundle-description";
import { matchesSearch } from '@/lib/shopping-discovery';
import discovery from './shopping-discovery.module.css';
import "./purchase-actions.css";
type Line = { id: number; quantity: number };
export const Context = createContext<{
  lines: Line[];
  quote?:CartQuote;
  quoteError?:string;
  retryQuote:()=>void;
  change: (id: number, n: number) => void;
  completePurchase: (folio:string) => void;
}>({retryQuote:()=>{}, lines: [], change: () => {}, completePurchase:()=>{} });
export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [ready, setReady] = useState(false);
  const pricing=useCartQuote(lines,ready);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("merlyn-cart-v1") || "[]");
      if (Array.isArray(saved))
        setLines(
          Array.from(
            new Map<number, Line>(
              saved
                .filter(
                  (l) =>
                    l &&
                    Number.isInteger(l.id) &&
                    l.id !== 0 &&
                    Number.isInteger(l.quantity) &&
                    l.quantity > 0,
                )
                .map((l) => [
                  l.id,
                  { id: l.id, quantity: Math.min(l.quantity, 100000) },
                ]),
            ).values(),
          ),
        );
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    try {
      if (ready) localStorage.setItem("merlyn-cart-v1", JSON.stringify(lines));
    } catch {}
  }, [lines, ready]);
  const completePurchase=useCallback((folio:string)=>{
    if(!ready)return;
    try{
      const remaining=completedCart(lines,folio,sessionStorage.getItem(CHECKOUT_ATTEMPT_KEY));
      if(remaining===null)return;
      // Persist before consuming the attempt so revisiting an old receipt cannot clear a new cart.
      localStorage.setItem('merlyn-cart-v1',JSON.stringify(remaining));
      sessionStorage.removeItem(CHECKOUT_ATTEMPT_KEY);
      sessionStorage.removeItem('merlyn-shipping-selection-v1');
      if(remaining.length===0)sessionStorage.removeItem('merlyn-shipping-draft-v1');
      setLines(remaining);
    }catch{}
  },[lines,ready]);
  function change(id: number, n: number) {
    if (!Number.isInteger(n)) return;
    setLines((old) =>
      n <= 0
        ? old.filter((l) => l.id !== id)
        : old.some((l) => l.id === id)
          ? old.map((l) =>
              l.id === id ? { id, quantity: Math.min(n, 100000) } : l,
            )
          : [...old, { id, quantity: Math.min(n, 100000) }],
    );
  }
  return (
    <Context.Provider value={{ lines, change, completePurchase,...pricing }}>{children}</Context.Provider>
  );
}
export function Header() {
  const { lines } = useContext(Context);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchType, setSearchType] = useState('/paquetes');
  return (
    <>
      <div className="announcement">
        Tu siguiente gran idea empieza con una pequeña caja.{" "}
        <span>Mayoreo para emprender ↗</span>
      </div>
      <header className="site-header" onKeyDown={event => { if (event.key === "Escape") { setMenuOpen(false); document.getElementById("mobile-menu-toggle")?.focus(); } }}>
        <Link className="brand" href="/">
          merlyn<span>mayoreo</span>
        </Link>
        <button id="mobile-menu-toggle" type="button" className="mobile-menu-toggle" aria-expanded={menuOpen} aria-controls="store-navigation" aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} onClick={() => setMenuOpen(open => !open)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />} Menú
        </button>
        <nav id="store-navigation" className={menuOpen ? "is-open" : ""} aria-label="Navegación principal" onClick={() => setMenuOpen(false)}>
          <Link href="/paquetes">Paquetes para emprender</Link>
          <Link href="/productos">Productos individuales</Link>
          <Link href="/#preguntas">Preguntas frecuentes</Link>
        </nav>
        <Link className="bag" href="/carrito" aria-label={`Ver carrito, ${lines.reduce((n, l) => n + l.quantity, 0)} artículos`} onClick={() => setMenuOpen(false)}>
          <ShoppingBag size={20} />
          <span>Carrito</span>
          <b>{lines.reduce((n, l) => n + l.quantity, 0)}</b>
        </Link>
      </header>
      <div className={discovery.searchBar}>
        <form action={searchType} method="get" role="search">
          <select aria-label="Dónde buscar" value={searchType} onChange={event=>setSearchType(event.target.value)}><option value="/paquetes">Paquetes</option><option value="/productos">Productos</option></select>
          <input name="q" type="search" aria-label="Buscar en la tienda" placeholder="Caricatura, deportivo, dama…" maxLength={120}/>
          <button type="submit" aria-label="Buscar"><Search size={20}/></button>
        </form>
        <Link href="/referencias">Referencias de clientes</Link><Link href="/ayuda">¿Necesitas ayuda?</Link>
      </div>
    </>
  );
}
export function AddButton({ item, chooseQuantity = false }: { item: Package; chooseQuantity?: boolean }) {
  const router = useRouter();
  const { lines, change } = useContext(Context);
  const [added, setAdded] = useState(false);
  const [amount, setAmount] = useState(1);
  const quantity = lines.find((l) => l.id === item.id)?.quantity || 0;
  const limit = Math.max(0, Math.min(item.available, 99) - quantity);
  const valid = Number.isInteger(amount) && amount >= 1 && amount <= limit;
  const review = chooseQuantity && added && quantity > 0;
  const preview=useCartQuote([...lines.filter(l=>l.id!==item.id),{id:item.id,quantity:quantity+amount}],chooseQuantity&&valid&&!review);
  const quotedBox=preview.quote?.lines.find(l=>l.kind==='BUNDLE'&&l.itemId===item.id);
  return (
    <div className="bundle-purchase-actions">
      {chooseQuantity && <label className={discovery.quantity}>Cajas para agregar
        <input type="number" min={1} max={limit || 1} value={amount} onChange={event=>{setAmount(Number(event.target.value));setAdded(false);}}/>
        <small>{valid ? `${amount * item.pieces} pares · ${quotedBox ? money(quotedBox.unitPrice)+' por caja al combinar con tu carrito' : preview.quoteError || 'Calculando precio con todo tu pedido…'}` : limit ? `Elige entre 1 y ${limit} cajas.` : 'Ya agregaste el máximo disponible.'}</small>
      </label>}
      {chooseQuantity&&preview.quote&&<p role="status">Pedido completo: <b>{money(preview.quote.subtotal)} MXN</b> · {preview.quote.totalPairs} pares. IVA incluido; envío aparte.{preview.quote.savings!=null&&preview.quote.savings>0?` Ahorro al combinar: ${money(preview.quote.savings)}.`:''}</p>}
      <button
        type="button"
        className="primary"
        disabled={!valid}
        onClick={() => {
          change(item.id, quantity + amount);
          setAdded(true);
        }}
      >
        {!item.available
          ? "Agotado"
          : quantity >= item.available
            ? "Máximo disponible"
            : added
              ? (amount === 1 ? "Agregar otra caja" : `Agregar otras ${amount} cajas`)
              : "Agregar a mi carrito"}{" "}
        <Plus size={18} />
      </button>
      <button type="button" className="primary buy-now" disabled={chooseQuantity ? !review && !valid : !item.available || quantity > item.available} onClick={() => {
        if (chooseQuantity && !review) change(item.id, quantity + amount);
        else if (!quantity) change(item.id, 1);
        router.push("/carrito");
      }}>{review ? 'Revisar mi pedido' : 'Comprar ahora'} <ArrowRight size={18} /></button>
      {added && (
        <p role="status" className="success">
          Paquete agregado. <Link href="/carrito">Ver mi carrito →</Link>
        </p>
      )}
      {chooseQuantity && quantity > 0 && <p><Link href="/carrito">Ya tienes {quantity} cajas en el carrito. Revisar pedido →</Link></p>}
    </div>
  );
}
export function Card({ item }: { item: Package }) {
  return (
    <article className="product-card">
      <div className="product-visual">
        <StorePhoto images={item.imageUrls} src={item.imageUrl} name={item.name}><BoxArt tone={item.tone} /></StorePhoto>
        <span className="product-badge">{item.pieces} piezas</span>
        <Link href={`/paquetes/${item.id}`} aria-label={`Ver ${item.name}`} className="round-arrow">
          <ArrowUpRight size={21} />
        </Link>
      </div>
      <div className="product-info">
        <span className="eyebrow">PAQUETE DE MAYOREO</span>
        <Link href={`/paquetes/${item.id}`}>
          <h3>{item.name}</h3>
        </Link>
        <BundleDescription text={item.description}/>
        {!item.description?.trim()&&<p>{item.items.map((i) => i.name).join(" · ")}</p>}
        <div className="price-row">
          <b>
            {money(item.price)} <small>MXN</small>
          </b>
          <span>{item.available ? "Disponible" : "Agotado"}</span>
        </div>
        <small>
          Referencia por 1 caja · IVA incluido · Envío aparte. El precio se ajusta al sumar cajas y pares sueltos de la misma categoría.
        </small>
        <AddButton item={item} />
      </div>
    </article>
  );
}
export function Catalog({ items, budget = "all", error, initialQuery = '' }: { items: Package[]; budget?: string; error?: string; initialQuery?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function setBudget(value: string) {
    const params = new URLSearchParams();
    if (value !== 'all') params.set('budget', value);
    if (query.trim()) params.set('q', query.trim());
    startTransition(() => router.replace(`/paquetes?${params}`, { scroll: false }));
  }
  const [query, setQuery] = useState(initialQuery);
  useEffect(()=>setQuery(initialQuery),[initialQuery]);
  const [sort, setSort] = useState("default");
  const filtered = items
    .filter(
      (p) =>
        matchesSearch([p.name, p.description || '', ...p.items.map(item=>item.name)].join(' '), query),
    )
    .sort((a, b) =>
      sort === "asc"
        ? a.price - b.price
          : sort === "desc"
          ? b.price - a.price
          : sort === 'unit' ? (a.pieces > 0 ? a.price/a.pieces : Infinity) - (b.pieces > 0 ? b.price/b.pieces : Infinity)
          : sort === 'pieces' ? b.pieces - a.pieces
          : 0,
    );
  return (
    <>
      <div className="catalog-controls">
        <div className="chips">
          {[
            ["all", "Todos los paquetes"],
            ["low", "Menos de $1,500"],
            ["mid", "$1,500 a $3,000"],
            ["high", "Más de $3,000"],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-pressed={budget === id}
              disabled={pending}
              className={budget === id ? "active" : ""}
              onClick={() => setBudget(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="search-sort">
          <label className="search">
            <Search size={18} />
            <input
              aria-label="Buscar paquete"
              placeholder="Busca tu paquete"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            aria-label="Ordenar paquetes"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="default">Orden del catálogo</option>
            <option value="asc">Menor precio</option>
            <option value="desc">Mayor precio</option>
            <option value="unit">Menor costo promedio por par</option>
            <option value="pieces">Más pares por caja</option>
          </select>
        </div>
      </div>
      <p className="result-count" aria-live="polite">
        {pending ? "Consultando paquetes…" : error ? "No se pudo cargar el catálogo" : `${filtered.length} paquetes para empezar`}
      </p>
      {error && <div role="alert"><p>{error}</p><button className="primary" disabled={pending} onClick={() => startTransition(() => router.refresh())}>Reintentar</button></div>}
      <div className="product-grid" aria-busy={pending} inert={pending} style={{ opacity: pending ? .55 : 1 }}>
        {filtered.map((p) => (
          <Card key={p.id} item={p}/>
        ))}
      </div>
      {!filtered.length && !error && !pending && (
        <div className="empty">
          <PackageCheck />
          <h3>No encontramos paquetes con estos filtros.</h3>
          <button
            onClick={() => {
              setQuery("");
              startTransition(()=>router.replace('/paquetes', {scroll:false}));
            }}
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </>
  );
}
