"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, useTransition, useCallback } from "react";
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
import "./purchase-actions.css";
type Line = { id: number; quantity: number };
export const Context = createContext<{
  lines: Line[];
  change: (id: number, n: number) => void;
  completePurchase: (folio:string) => void;
}>({ lines: [], change: () => {}, completePurchase:()=>{} });
export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [ready, setReady] = useState(false);
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
    <Context.Provider value={{ lines, change, completePurchase }}>{children}</Context.Provider>
  );
}
export function Header() {
  const { lines } = useContext(Context);
  const [menuOpen, setMenuOpen] = useState(false);
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
    </>
  );
}
export function AddButton({ item }: { item: Package }) {
  const router = useRouter();
  const { lines, change } = useContext(Context);
  const [added, setAdded] = useState(false);
  const quantity = lines.find((l) => l.id === item.id)?.quantity || 0;
  return (
    <div className="bundle-purchase-actions">
      <button
        type="button"
        className="primary"
        disabled={quantity >= item.available || quantity >= 99}
        onClick={() => {
          change(item.id, quantity + 1);
          setAdded(true);
        }}
      >
        {!item.available
          ? "Agotado"
          : quantity >= item.available
            ? "Máximo disponible"
            : added
              ? "Agregar otra caja"
              : "Agregar a mi carrito"}{" "}
        <Plus size={18} />
      </button>
      <button type="button" className="primary buy-now" disabled={!item.available || quantity > item.available} onClick={() => {
        if (!quantity) change(item.id, 1);
        router.push("/carrito");
      }}>Comprar ahora <ArrowRight size={18} /></button>
      {added && (
        <p role="status" className="success">
          Paquete agregado. <Link href="/carrito">Ver mi carrito →</Link>
        </p>
      )}
    </div>
  );
}
export function Card({ item }: { item: Package }) {
  return (
    <article className="product-card">
      <Link href={`/paquetes/${item.id}`} className="product-visual">
        <StorePhoto src={item.imageUrl} name={item.name}><BoxArt tone={item.tone} /></StorePhoto>
        <span className="product-badge">{item.pieces} piezas</span>
        <span className="round-arrow">
          <ArrowUpRight size={21} />
        </span>
      </Link>
      <div className="product-info">
        <span className="eyebrow">PAQUETE DE MAYOREO</span>
        <Link href={`/paquetes/${item.id}`}>
          <h3>{item.name}</h3>
        </Link>
        <p>{item.items.map((i) => i.name).join(" · ")}</p>
        <div className="price-row">
          <b>
            {money(item.price)} <small>MXN</small>
          </b>
          <span>{item.available ? "Disponible" : "Agotado"}</span>
        </div>
        <small>
          Desde {money(item.price / item.pieces)} por pieza · Envío aparte
        </small>
        <AddButton item={item} />
      </div>
    </article>
  );
}
export function Catalog({ items, budget = "all", error }: { items: Package[]; budget?: string; error?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function setBudget(value: string) {
    startTransition(() => router.replace(value === "all" ? "/paquetes" : `/paquetes?budget=${encodeURIComponent(value)}`, { scroll: false }));
  }
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("default");
  const filtered = items
    .filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "asc"
        ? a.price - b.price
        : sort === "desc"
          ? b.price - a.price
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
            <option value="default">Orden recomendado</option>
            <option value="asc">Menor precio</option>
            <option value="desc">Mayor precio</option>
          </select>
        </div>
      </div>
      <p className="result-count" aria-live="polite">
        {pending ? "Consultando paquetes…" : error ? "No se pudo cargar el catálogo" : `${filtered.length} paquetes para empezar`}
      </p>
      {error && <div role="alert"><p>{error}</p><button className="primary" disabled={pending} onClick={() => startTransition(() => router.refresh())}>Reintentar</button></div>}
      <div className="product-grid" aria-busy={pending} inert={pending} style={{ opacity: pending ? .55 : 1 }}>
        {filtered.map((p) => (
          <Card key={p.id} item={p} />
        ))}
      </div>
      {!filtered.length && !error && !pending && (
        <div className="empty">
          <PackageCheck />
          <h3>No encontramos paquetes con estos filtros.</h3>
          <button
            onClick={() => {
              setBudget("all");
              setQuery("");
            }}
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </>
  );
}
