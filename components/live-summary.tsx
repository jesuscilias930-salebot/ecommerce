"use client";
import Link from "next/link";
import "./volume-drawer.css";
import { useContext, useRef } from "react";
import { Context } from "./shop";
import type { Original } from "@/lib/product-catalog";
import type { Package } from "@/lib/catalog";
import { calculateGroups } from "@/lib/live-pricing";
import { money } from "@/lib/money";
export function LiveSummary({
  products,
  packages = [],
}: {
  products: Original[];
  packages?: Package[];
}) {
  const drawer = useRef<HTMLDialogElement>(null);
  const { lines, change } = useContext(Context);
  const groups = calculateGroups(products, lines);
  const bundles = lines
    .filter((l) => l.id > 0)
    .map((l) => ({ ...l, product: packages.find((p) => p.id === l.id) }));
  const valid =
    groups.every((g) => g.total !== null) &&
    bundles.every((l) => l.product && l.quantity <= l.product.available);
  const total =
    groups.reduce((s, g) => s + Math.round((g.total || 0) * 100), 0) +
    bundles.reduce(
      (s, l) => s + Math.round((l.product?.price || 0) * 100) * l.quantity,
      0,
    );
  const pieces =
    groups.reduce((sum, g) => sum + g.quantity, 0) +
    bundles.reduce((sum, l) => sum + (l.product?.pieces || 0) * l.quantity, 0);
  return (
    <>
      <div className="volume-launcher" >
        <div aria-live="polite">
          <span>{pieces} piezas en tu pedido</span>
          <strong>{valid ? money(total / 100) : "Por confirmar"} MXN</strong>
          <small>Impuestos incluidos · envío aparte</small>
        </div>
        <button className="primary" onClick={() => drawer.current?.showModal()}>
          Ver desglose por grupo →
        </button>
      </div>
      <dialog
        ref={drawer}
        className="volume-drawer"
        aria-label="Tu bolsa por grupos"
        onClick={(e) => {
          if (e.target === e.currentTarget) drawer.current?.close();
        }}
      >
        <button
          className="drawer-close"
          onClick={() => drawer.current?.close()}
          aria-label="Cerrar desglose"
        >
          Cerrar ✕
        </button>
        <section className="live-summary" aria-label="Desglose de tu compra">
          <header>
            <div>
              <span className="eyebrow">TU PRECIO SE AJUSTA CONTIGO</span>
              <h2>Así va tu bolsa</h2>
            </div>
            <span className="live-tag">Cálculo al instante</span>
          </header>
          <p>
            Los pares del <b>mismo grupo se suman</b>. Al alcanzar una tarifa
            menor, se aplica a todos los pares de ese grupo. Otros grupos no se
            mezclan.
          </p>
          {!lines.length && (
            <div className="live-empty">
              Agrega tu primer producto para ver aquí su precio, el total de su
              grupo y el total general.
            </div>
          )}
          <div className="live-groups">
            {groups.map((g) => (
              <article key={g.key} className="live-group">
                <header>
                  <h3>{g.name}</h3>
                  <b>{g.quantity} pares</b>
                </header>
                <p className="group-unit-price">
                  {g.rows.every((l) => l.price != null) &&
                  new Set(g.rows.map((l) => l.price)).size === 1
                    ? `Tarifa del grupo: ${money(g.rows[0].price!)} / par`
                    : "Cada modelo conserva su tarifa; el volumen se comparte."}
                </p>
                {g.next ? (
                  <div className="live-progress">
                    <p>
                      Agrega <b>{g.next - g.quantity} pares</b> de este grupo
                      para alcanzar la siguiente tarifa menor de al menos uno de
                      sus productos.
                    </p>
                    <progress
                      value={g.quantity}
                      max={g.next}
                      aria-label={`Progreso de ${g.name} hacia ${g.next} pares`}
                    />
                    <small>
                      {g.quantity} / {g.next} pares · Consulta las tarifas por
                      producto
                    </small>
                  </div>
                ) : (
                  <p className="live-progress">
                    {g.total === null
                      ? "Revisa disponibilidad y reglas de este grupo."
                      : "No hay un siguiente descuento configurado para los productos seleccionados."}
                  </p>
                )}
                {g.rows.map((l) => (
                  <div className="live-row" key={l.id}>
                    <div>
                      <strong>
                        {l.product?.name || "Producto no disponible"}
                      </strong>
                      <small>
                        {l.price === null
                          ? "Stock o precio por confirmar"
                          : `${l.quantity} pares × ${money(l.price)} / par`}
                      </small>
                    </div>
                    <b>{l.total === null ? "Por confirmar" : money(l.total)}</b>
                    <div className="live-edit">
                      <label>
                        Cantidad
                        <input
                          type="number"
                          min="1"
                          max={Math.min(
                            l.product?.currentStock || 100000,
                            100000,
                          )}
                          aria-label={`Cantidad de ${l.product?.name || "producto"}`}
                          value={l.quantity}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            if (Number.isInteger(n) && n > 0 && n <= 100000)
                              change(l.id, n);
                          }}
                        />
                      </label>
                      <button onClick={() => change(l.id, 0)}>Quitar</button>
                    </div>
                  </div>
                ))}
                <footer>
                  <span>Total {g.name}</span>
                  <strong>
                    {g.total === null ? "Por confirmar" : money(g.total)}
                  </strong>
                </footer>
              </article>
            ))}
          </div>
          {bundles.length > 0 && (
            <article className="live-group">
              <h3>Cajas · Precio fijo</h3>
              {bundles.map((l) => (
                <p key={l.id}>
                  {l.quantity} × {l.product?.name || "Caja no disponible"}{" "}
                  <b>
                    {l.product
                      ? money(l.product.price * l.quantity)
                      : "Por confirmar"}
                  </b>
                </p>
              ))}
              <small>
                No suman pares a los grupos de productos individuales.
              </small>
            </article>
          )}
          <div className="live-total" aria-live="polite" aria-atomic="true">
            <div>
              <span>{pieces} piezas · Total general estimado de productos</span>
              <strong>
                {valid ? money(total / 100) : "Por confirmar"}{" "}
                <small>MXN</small>
              </strong>
              <small>
                Impuestos incluidos. Envío por cotizar. No es todavía el total final a
                pagar.
              </small>
            </div>
            <Link className="primary" href="/carrito">
              Revisar mi carrito →
            </Link>
          </div>
          <small>
            Estimación con las tarifas del catálogo. El servidor vuelve a
            validar precios y existencias en la bolsa. Si quitas pares, el
            precio por par puede subir al cambiar de rango.
          </small>
        </section>
      </dialog>
    </>
  );
}
