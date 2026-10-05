"use client";
import {useId,useState} from 'react';
import type {Original} from '@/lib/product-catalog';
import type {calculateGroups} from '@/lib/live-pricing';
import {pricingKey} from '@/lib/live-pricing';
import {money} from '@/lib/money';
import {salePackSize,saleUnit,saleUnits,saleUnitPrice} from '@/lib/sale-presentation';
import './category-pricing.css';

export function CategoryPricing({label,products,groups,incomplete}:{label:string;products:Original[];groups:ReturnType<typeof calculateGroups>;incomplete:boolean}) {
  // Only identical tariffs in the same pricing pool share a scale.
  const columns:Original[][]=[];
  for(const product of products){
    const existing=columns.find(column=>pricingKey(column[0])===pricingKey(product)&&JSON.stringify(column[0].rules)===JSON.stringify(product.rules));
    if(existing)existing.push(product);else columns.push([product]);
  }
  const [selectedId,setSelectedId]=useState<number|null>(null);
  const selectId=useId();
  const selected=columns.find(column=>column[0].id===selectedId)||columns[0];
  if(!selected)return null;
  const product=selected[0];
  const name=selected.length>1?'Todos los modelos con esta tarifa':product.name;
  const group=groups.find(group=>group.key===pricingKey(product));
  const count=group?.quantity||0;
  const size=salePackSize(product),unit=saleUnit(product),units=saleUnits(product);
  const tiers=product.rules.filter(rule=>Number.isFinite(Number(rule.pricePerUnit))&&Number(rule.pricePerUnit)>=0).map(rule=>({
    rule,min:Math.max(1,Math.ceil(rule.minQuantity/size)),
    max:rule.maxQuantity==null||rule.maxQuantity>=2147483647?null:Math.floor(rule.maxQuantity/size),
    price:saleUnitPrice(Number(rule.pricePerUnit),product),
  })).filter(tier=>tier.max===null||tier.max>=tier.min).sort((a,b)=>a.min-b.min);
  const matches=tiers.filter(tier=>count>=tier.rule.minQuantity&&(tier.rule.maxQuantity==null||count<=tier.rule.maxQuantity));
  const current=count>0?(matches.length===1?matches[0]:null):tiers[0];
  const verified=!incomplete&&!!current;
  const next=verified?tiers.find(tier=>tier.rule.minQuantity>count&&tier.price<current!.price):undefined;
  const missing=next?Math.ceil((next.rule.minQuantity-count)/size):0;
  const selectedRows=group?.rows.filter(row=>selected.some(p=>p.id===row.product?.id))||[];
  const subtotal=!incomplete&&selectedRows.every(row=>row.total!==null)?selectedRows.reduce((sum,row)=>sum+Math.round(row.total!*100),0)/100:null;
  const combined=pricingKey(product).startsWith('category:')||pricingKey(product).startsWith('group:')||pricingKey(product)==='shorts:caballero';
  return <aside className="category-pricing" aria-label={`Precios de ${label}`}>
    <h3>Tu precio de mayoreo</h3>
    {columns.length>1?<div className="category-price-picker"><label htmlFor={selectId}>Consultar precio de</label><select id={selectId} value={product.id} onChange={event=>setSelectedId(Number(event.target.value))}>{columns.map(column=><option key={column[0].id} value={column[0].id}>{column.map(p=>p.name).join(' / ')}</option>)}</select></div>:<p className="category-price-model">{selected.length>1?label:name}</p>}
    <p className="category-price-scope">{combined?'Sumamos los de tus paquetes e individuales de este grupo.':'Sumamos este producto en paquetes e individuales; otros productos tienen su propia escala.'}{size===3?' 1 tripar = 3 pares.':''}</p>
    <div className="category-price-overview" role="status" aria-live="polite" aria-atomic="true">
      <div><span>Llevas acumulados</span><strong>{size===3&&count%3===0?count/3:count} {size===3&&count%3?'pares':units}</strong>{size===3&&<small>{count%3?'Incluye el contenido de tus cajas':`${count} pares en total`}</small>}</div>
      <div><span>{count>0?'Tu tarifa actual':'Precio inicial'}</span><strong>{verified?money(current!.price):'Por verificar'}</strong><small>por {unit}{size===3?' de 3 pares':''}</small></div>
    </div>
    {next&&<div className="category-next-price"><p>Agrega <b>{missing} {missing===1?unit:units}</b> {combined?'a este grupo':'de este producto'} y alcanza <b>{money(next.price)} por {unit}</b>.</p><progress value={Math.min(count,next.rule.minQuantity)} max={next.rule.minQuantity} aria-label={`Avance al siguiente precio de ${money(next.price)} por ${unit}`}/></div>}
    {verified&&count>0&&!next&&<p className="category-best-price">✓ Ya tienes la mejor tarifa disponible de esta escala.</p>}
    <details className="category-price-details"><summary>Ver todos los precios por cantidad</summary>
      <p className="category-price-list-heading">{name} · Precio por {unit}{size===3?' (3 pares)':''}</p>
      <ul className="category-price-list" aria-label={`Escalas de ${name}`}>
        {tiers.map((tier,index)=>{
          const active=!incomplete&&count>0&&matches.length===1&&current===tier;
          return <li key={`${tier.min}-${index}`} className={active?'category-price-active':undefined}><div><span>{tier.max===null?`${tier.min} o más`:tier.min===tier.max?tier.min:`${tier.min}–${tier.max}`} {units}</span>{active&&<small>✓ Tu tarifa actual</small>}</div><strong>{money(tier.price)}</strong></li>;
        })}
      </ul>
      {!tiers.length&&<p>No hay una escala disponible. Consulta con un asesor.</p>}
      <small>Se aplica automáticamente al agregar o quitar artículos. Las cajas también cuentan.</small>
    </details>
    <div className="category-price-subtotal"><span>Individuales {columns.length>1?'de esta selección':'de este grupo'}</span><b>{subtotal===null?'Por verificar':money(subtotal)}</b></div>
    <small className="category-price-footer">{incomplete?'Falta verificar un paquete. Revisa tu carrito.':'MXN · IVA incluido · Envío aparte.'}</small>
  </aside>;
}
