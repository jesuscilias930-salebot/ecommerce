"use client";
import "./volume-pricing.css";
import type { Package } from "@/lib/catalog";
import Link from "next/link";
import { useContext, useState, useEffect } from "react";
import { matchesSearch } from '@/lib/shopping-discovery';
import { Search, ShoppingBag, UserRound, Bot } from "lucide-react";
import { Context } from "./shop";
import { ProductGroupCard } from "./product-group-card";
import { groupProducts, groupSearchText } from "@/lib/product-groups";
import type { Original } from "@/lib/product-catalog";
import { groupByCategory } from "@/lib/product-categories";
import categoryStyles from "./product-categories.module.css";
import {PurchaseReferences} from './testimonial-gallery';
import {cartCount} from '@/lib/bundle-selection';
import "./product-group-card.css";

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
  // Una ficha por modelo o categoría; se elige género, color y talla dentro.
  const productGroups = groupProducts(products);
  const filtered = productGroups.filter(group => matchesSearch(groupSearchText(group), query));
  const categories = groupByCategory(filtered.map(group => ({...group, category: group.category})));
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
          {filtered.length} {filtered.length === 1 ? "producto" : "productos"} <span>· Elige género, color y talla</span>
        </span>
        <small>1. Elige cantidades · 2. Agrega al carrito · 3. Consulta tu tarifa</small>
      </div>
      {categories.length>1&&<nav className={categoryStyles.navigation} aria-label="Ir a una categoría">
        {categories.map(category=><a key={category.key} href={`#${categoryId(category.key)}`}>{category.label}<span>{category.products.length}</span></a>)}
      </nav>}
      {categories.map(category=><section className={categoryStyles.section} key={category.key} id={categoryId(category.key)} aria-labelledby={`${categoryId(category.key)}-title`}>
        <header className={categoryStyles.header}><h2 id={`${categoryId(category.key)}-title`}>{category.label}</h2><span>{category.products.length} {category.products.length===1?'producto':'productos'}</span></header>
        <div className="product-group-list">{category.products.map(group=><ProductGroupCard key={group.key} group={group} products={products} packages={packages}/>)}</div>
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
