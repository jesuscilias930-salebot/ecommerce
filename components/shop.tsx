"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { packageQuantityLabel,isShort } from "@/lib/sale-presentation";
import { createContext, useContext, useEffect, useState, useTransition, useCallback, useRef } from "react";
import {useCartQuote} from './use-cart-quote';
import {QuantityInput} from './quantity-input';
import type {CartQuote} from '@/lib/cart-quote';
import {validSelection,cleanSelection,customizable,cartLineKey,cartCount,setCartQuantity,type CartLine,type Selection} from '@/lib/bundle-selection';
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
import {packageCategories} from "@/lib/package-categories";
import type { Package } from "@/lib/catalog";
import { money } from "@/lib/money";
import { BoxArt } from "./box-art";
import { StorePhoto } from "./store-photo";
import { matchesSearch } from '@/lib/shopping-discovery';
import discovery from './shopping-discovery.module.css';
import "./purchase-actions.css";
import {trackStoreEvent} from '@/lib/store-events';
type Line = CartLine;
export const Context = createContext<{
  lines: Line[];
  quote?:CartQuote;
  quoteError?:string;
  retryQuote:()=>void;
  change: (id: number, n: number,selection?:Selection) => void;
  addAssorted:(id:number,max:number)=>void;
  configureBundle:(id:number,n:number,selection?:Selection)=>void;
  completePurchase: (folio:string) => void;
}>({retryQuote:()=>{}, lines: [], change: () => {},addAssorted:()=>{},configureBundle:()=>{}, completePurchase:()=>{} });
export function ShopProvider({ children }: { children: React.ReactNode }) {
  const pathname=usePathname(),scrollRoot=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(!window.location.hash)scrollRoot.current?.scrollTo({top:0});},[pathname]);
  const [lines, setLines] = useState<Line[]>([]);
  const [ready, setReady] = useState(false);
  const pricing=useCartQuote(lines,ready);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("merlyn-cart-v1") || "[]");
      if (Array.isArray(saved))
        setLines(
          Array.from(
            new Map<string, Line>(
              saved
                .filter(
                  (l) =>
                    l &&
                    Number.isInteger(l.id) &&
                    l.id !== 0 &&
                    validSelection(l.selection) &&
                    Number.isInteger(l.quantity) &&
                    l.quantity > 0,
                )
                .map((l) => [
                  cartLineKey(l),
                  { id: l.id, quantity: Math.min(l.quantity, 100000), ...(l.selection?{selection:cleanSelection(l.selection)}:{}) },
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
  function change(id: number, n: number,selection?:Selection) {
    if (!Number.isInteger(n)) return;
    const previous=lines.find(l=>cartLineKey(l)===cartLineKey({id,quantity:n,selection}))?.quantity||0;
    if(n>previous)void trackStoreEvent('AddToCart',{id,quantity:n-previous});
    setLines(old=>setCartQuantity(old,id,n,selection));
  }
  function addAssorted(id:number,max:number){
    if(lines.filter(l=>l.id===id).reduce((n,l)=>n+l.quantity,0)>=Math.min(99,max))return;
    void trackStoreEvent('AddToCart',{id,quantity:1,mode:'assorted'});
    setLines(old=>{
    if(old.filter(l=>l.id===id).reduce((n,l)=>n+l.quantity,0)>=Math.min(99,max))return old;
    return setCartQuantity(old,id,(old.find(l=>l.id===id&&!l.selection)?.quantity||0)+1);
  });}
  function configureBundle(id:number,n:number,selection?:Selection){
    if(!Number.isInteger(id)||id<=0||!Number.isInteger(n)||n<1||n>99||!validSelection(selection))return;
    void trackStoreEvent('ConfigurationCompleted',{id,quantity:n,mode:selection?'custom':'assorted'});
    const previous=lines.find(l=>l.id===id&&!!l.selection===!!selection)?.quantity||0;
    if(n>previous)void trackStoreEvent('AddToCart',{id,quantity:n-previous,mode:selection?'custom':'assorted'});
    setLines(old=>[...old.filter(l=>l.id!==id||!!l.selection!==!!selection),{id,quantity:n,...(selection?{selection:cleanSelection(selection)}:{})}]);
  }
  return (
    <Context.Provider value={{ lines, change,addAssorted,configureBundle, completePurchase,...pricing }}><div ref={scrollRoot} className="store-scroll">{children}</div><FloatingCart/></Context.Provider>
  );
}
function FloatingCart(){
 const {lines}=useContext(Context),pathname=usePathname(),count=cartCount(lines);
 if(!count||!['/','/paquetes','/productos'].includes(pathname)&&!pathname.startsWith('/paquetes/'))return null;
 return <Link className="floating-cart" href="/carrito" aria-label={`Ir al carrito, ${count} cajas y productos`}><ShoppingBag size={23}/><span>Ver carrito</span><b aria-live="polite">{count}</b></Link>;
}
export function Header() {
  const pathname=usePathname();
  const compact=pathname==='/carrito'||pathname==='/checkout';
  const { lines } = useContext(Context);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchType, setSearchType] = useState('/paquetes');
  useEffect(()=>setSearchType(pathname==='/productos'?'/productos':'/paquetes'),[pathname]);
  if(compact)return <header className="site-header checkout-header"><Link className="brand" href="/">merlyn<span>mayoreo</span></Link><Link href={pathname==='/checkout'?'/carrito':'/paquetes'}>{pathname==='/checkout'?'← Volver al carrito':'← Seguir comprando'}</Link><Link href="/ayuda">Ayuda</Link></header>;
  return (
    <>
      <div className="announcement">
        Calcetines al mayoreo para emprender y resurtir.{" "}
        <span>Compra sin crear una cuenta ↗</span>
      </div>
      <header className="site-header" onKeyDown={event => { if (event.key === "Escape") { setMenuOpen(false); document.getElementById("mobile-menu-toggle")?.focus(); } }}>
        <Link className="brand" href="/">
          merlyn<span>mayoreo</span>
        </Link>
        <button id="mobile-menu-toggle" type="button" className="mobile-menu-toggle" aria-expanded={menuOpen} aria-controls="store-navigation" aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} onClick={() => setMenuOpen(open => !open)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />} Menú
        </button>
        <nav id="store-navigation" className={menuOpen ? "is-open" : ""} aria-label="Navegación principal" onClick={() => setMenuOpen(false)}>
          <Link href="/paquetes">Paquetes de mayoreo</Link>
          <Link href="/productos">Arma tu pedido</Link>
          <Link href="/#preguntas">Preguntas frecuentes</Link>
        </nav>
        <Link className="bag" href="/carrito" aria-label={`Ver carrito, ${cartCount(lines)} cajas y productos`} onClick={() => setMenuOpen(false)}>
          <ShoppingBag size={20} />
          <span>Carrito</span>
          <b>{cartCount(lines)}</b>
        </Link>
      </header>
      {pathname!=='/productos'&&<div className={discovery.searchBar}>
        <form action={searchType} method="get" role="search">
          <select aria-label="Dónde buscar" value={searchType} onChange={event=>setSearchType(event.target.value)}><option value="/paquetes">Paquetes</option><option value="/productos">Productos</option></select>
          <input name="q" type="search" aria-label="Buscar en la tienda" placeholder="Caricatura, deportivo, dama…" maxLength={120}/>
          <button type="submit" aria-label="Buscar"><Search size={20}/></button>
        </form>
        <Link href="/referencias">Referencias de clientes</Link><Link href="/ayuda">¿Necesitas ayuda?</Link>
      </div>}
    </>
  );
}
export function AddButton({ item, chooseQuantity = false }: { item: Package; chooseQuantity?: boolean }) {
  const router = useRouter();
  const { lines, change,addAssorted } = useContext(Context);
  const [added, setAdded] = useState(false);
  const [amount, setAmount] = useState(1);
  const quantity = lines.find((l) => l.id === item.id)?.quantity || 0;
  const limit = Math.max(0, Math.min(item.available, 99) - quantity);
  const valid = Number.isInteger(amount) && amount >= 1 && amount <= limit;
  const review = chooseQuantity && added && quantity > 0;
  const preview=useCartQuote([...lines.filter(l=>l.id!==item.id),{id:item.id,quantity:quantity+amount}],chooseQuantity&&valid);
  const quotedBox=preview.quote?.lines.find(l=>l.kind==='BUNDLE'&&l.itemId===item.id);
  if(customizable(item))return <div className="bundle-purchase-actions">
    <Link className="text-link" href={`/paquetes/${item.id}#comprar-paquete`}>Personalizar géneros <ArrowRight size={18}/></Link>
    <button type="button" className="primary" disabled={!item.available||lines.filter(l=>l.id===item.id).reduce((n,l)=>n+l.quantity,0)>=Math.min(99,item.available)} onClick={()=>{addAssorted(item.id,item.available);setAdded(true);}}>{item.available?'Agregar caja surtida al carrito':'Agotado'} <Plus size={18}/></button>
    {added&&<p role="status" className="success">Caja surtida agregada. <Link href="/carrito">Ver carrito →</Link></p>}
  </div>;
  return (
    <div className="bundle-purchase-actions">
      {chooseQuantity&&<div className="applicable-box-price" aria-live="polite"><strong>{valid?(quotedBox?money(quotedBox.unitPrice):'Verificando precio…'):'Elige una cantidad'}</strong><span>MXN por caja · IVA incluido · Envío aparte</span>{quotedBox&&valid&&<small>{money(Math.round(quotedBox.unitPrice*100)*amount/100)} por las {amount} cajas que agregarás. Precio calculado con tu carrito.</small>}</div>}
      {chooseQuantity && <label className={discovery.quantity}>Cajas para agregar
        <QuantityInput min={1} max={limit || 1} value={amount} onChange={event=>{setAmount(Number(event.target.value));setAdded(false);}}/>
        <small>{valid ? `${amount * item.pieces} unidades · ${quotedBox ? money(quotedBox.unitPrice)+' por caja al combinar con tu carrito' : preview.quoteError || 'Calculando precio con todo tu pedido…'}` : limit ? `Elige entre 1 y ${limit} cajas.` : 'Ya agregaste el máximo disponible.'}</small>
      </label>}
      {chooseQuantity&&preview.quote&&<p role="status">Pedido completo: <b>{money(preview.quote.subtotal)} MXN</b> · {preview.quote.totalPairs} unidades. IVA incluido; envío aparte.{preview.quote.savings!=null&&preview.quote.savings>0?` Ahorro al combinar: ${money(preview.quote.savings)}.`:''}</p>}
      <button
        type="button"
        className="primary"
        disabled={!valid||(chooseQuantity&&!quotedBox)}
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
      <button type="button" className="primary buy-now" disabled={chooseQuantity ? !review && (!valid||!quotedBox) : !item.available || quantity > item.available} onClick={() => {
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
        <StorePhoto images={item.imageUrls} src={item.imageUrl} name={item.name} href={`/paquetes/${item.id}`}><BoxArt tone={item.tone} /></StorePhoto>
        <Link href={`/paquetes/${item.id}`} aria-label={`Ver ${item.name}`} className="round-arrow">
          <ArrowUpRight size={21} />
        </Link>
      </div>
      <div className="product-info">
        <span className="eyebrow">PAQUETE DE MAYOREO</span>
        <Link href={`/paquetes/${item.id}`}>
          <h3>{item.name}</h3>
        </Link>
        <p className="card-content-preview"><strong>{packageQuantityLabel(item)}</strong> · {item.items.length} tipos de producto</p>
        <div className="price-row">
          <b>
            {money(item.price)} <small>MXN</small>
          </b>
          <span>{item.available ? "Disponible" : "Agotado"}</span>
        </div>
        <small>
          Referencia por caja · IVA incluido · Envío aparte{item.pieces>0?` · Promedio ${money(item.price/item.pieces)} por ${item.items.every(i=>!isShort(i))?'par':'unidad'}`:''}.
        </small>
        <small>Tu precio se ajusta al combinar productos en el carrito.</small>
        <AddButton item={item} />
      </div>
    </article>
  );
}
export function PackageSections({items,limitPerCategory}:{items:Package[];limitPerCategory?:number}) {
 return <div>{packageCategories(items).map(group=><section key={group.name} style={{marginBottom:40}} aria-label={group.name}><div className="section-heading"><h3>{group.name}</h3><span>{group.items.length} paquetes</span></div><div className="product-grid">{group.items.slice(0,limitPerCategory).map(item=><Card key={item.id} item={item}/>)}</div></section>)}</div>;
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
        matchesSearch([p.name, p.storeCategory || '', p.description || '', ...p.items.map(item=>item.name)].join(' '), query),
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
            <option value="unit">Menor costo promedio por unidad</option>
            <option value="pieces">Más unidades por caja</option>
          </select>
        </div>
      </div>
      <p className="result-count" aria-live="polite">
        {pending ? "Consultando paquetes…" : error ? "No se pudo cargar el catálogo" : `${filtered.length} paquetes para empezar`}
      </p>
      {error && <div role="alert"><p>{error}</p><button className="primary" disabled={pending} onClick={() => startTransition(() => router.refresh())}>Reintentar</button></div>}
      <div aria-busy={pending} inert={pending} style={{ opacity: pending ? .55 : 1 }}>
        <PackageSections items={filtered}/>
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
