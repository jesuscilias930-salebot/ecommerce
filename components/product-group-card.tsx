"use client";
import {useContext,useId,useState} from 'react';
import {ArrowUpRight,Check,Minus,Plus} from 'lucide-react';
import {Context} from './shop';
import {QuantityInput} from './quantity-input';
import {StorePhoto} from './store-photo';
import {SockVisual} from './sock-visual';
import {ProductViewEvent} from './product-view-event';
import type {Package} from '@/lib/catalog';
import type {Original} from '@/lib/product-catalog';
import {calculateGroups,pricingKey,pricingName} from '@/lib/live-pricing';
import {fixedPairsInCart} from '@/lib/price-preview';
import {money} from '@/lib/money';
import {colorSwatch} from '@/lib/color-swatch';
import {salePackSize,saleUnit,saleUnits,saleUnitPrice,saleQuantityLabel} from '@/lib/sale-presentation';
import {DIMENSION_LABELS,genderLabel,groupColors,optionsFor,productColor,reconcile,resolveVariant,type Choice,type Dimension,type ProductGroup} from '@/lib/product-groups';
import styles from './product-group-card.module.css';

/** Tabla de precios por cantidad del producto elegido; marca la tarifa con lo que ya llevas. */
function PriceTable({product,count}:{product:Original;count:number}){
 const size=salePackSize(product),unit=saleUnit(product),units=saleUnits(product);
 const tiers=product.rules.filter(rule=>Number.isFinite(Number(rule.pricePerUnit))&&Number(rule.pricePerUnit)>=0).map(rule=>({
  rule,min:Math.max(1,Math.ceil(rule.minQuantity/size)),
  max:rule.maxQuantity==null||rule.maxQuantity>=2147483647?null:Math.floor(rule.maxQuantity/size),
  price:saleUnitPrice(Number(rule.pricePerUnit),product),
 })).filter(tier=>tier.max===null||tier.max>=tier.min).sort((a,b)=>a.min-b.min);
 if(!tiers.length)return <p className={styles.noTiers}>Precio por confirmar. Consulta con un asesor.</p>;
 const reference=Math.max(count,1);
 const active=tiers.find(tier=>reference>=tier.rule.minQuantity&&(tier.rule.maxQuantity==null||reference<=tier.rule.maxQuantity));
 const next=active?tiers.find(tier=>tier.rule.minQuantity>reference&&tier.price<active.price):undefined;
 const missing=next?Math.ceil((next.rule.minQuantity-count)/size):0;
 const base=tiers[0].price;
 return <div className={styles.priceTable}>
  <table>
   <caption>Precio por {unit}{size===3?' (3 pares)':''} según cuántos lleves</caption>
   <thead><tr><th scope="col">Cantidad</th><th scope="col">Precio</th><th scope="col">Ahorro</th></tr></thead>
   <tbody>{tiers.map((tier,index)=>{
    const current=tier===active;
    return <tr key={`${tier.min}-${index}`} className={current?styles.activeTier:undefined}>
     <td>{tier.max===null?`${tier.min} o más`:tier.min===tier.max?tier.min:`${tier.min} a ${tier.max}`} {units}{current&&<small> · {count>0?'tu tarifa':'precio inicial'}</small>}</td>
     <td><b>{money(tier.price)}</b></td>
     <td>{tier.price<base?`-${Math.round((1-tier.price/base)*100)}%`:'—'}</td>
    </tr>;
   })}</tbody>
  </table>
  {next?<p className={styles.nextTier}>Agrega <b>{missing} {missing===1?unit:units}</b> más y paga <b>{money(next.price)}</b> por {unit}.</p>
   :count>0&&active?<p className={styles.bestTier}><Check size={14}/> Ya tienes la mejor tarifa.</p>:null}
 </div>;
}

/** Ficha agrupada: elige género, color y talla (según existencias) y cantidad. */
export function ProductGroupCard({group,products,packages=[]}:{group:ProductGroup;products:Original[];packages?:Package[]}){
 const {lines,change}=useContext(Context);
 const [choice,setChoice]=useState<Choice>(()=>reconcile(group,{}));
 const [amount,setAmount]=useState(1);
 const inputId=useId();
 const selected=resolveVariant(group,choice)||group.products.find(product=>product.currentStock>0)||group.products[0];
 const pick=(dimension:Dimension,value:string)=>{setChoice(current=>reconcile(group,{...current,[dimension]:value},dimension));setAmount(1);};
 const p=selected;
 const packSize=salePackSize(p),unit=saleUnit(p),units=saleUnits(p);
 const quantity=lines.find(line=>line.id===-p.id)?.quantity||0;
 const pairAmount=amount*packSize;
 const max=Math.max(0,Math.floor(Math.min(p.currentStock-fixedPairsInCart(p.id,lines,packages),100000-quantity)/packSize));
 const incomplete=lines.some(line=>line.id>0&&!packages.some(item=>item.id===line.id));
 const valid=!incomplete&&!!p.rules.length&&quantity%packSize===0&&Number.isInteger(amount)&&amount>=1&&amount<=max;
 const groups=calculateGroups(products,lines,packages);
 const current=groups.find(entry=>entry.key===pricingKey(p));
 const count=current?.quantity||0;
 const proposed=calculateGroups(products,[...lines.filter(line=>line.id!==-p.id),{id:-p.id,quantity:quantity+(valid?pairAmount:0)}],packages).find(entry=>entry.key===pricingKey(p));
 const proposedRow=proposed?.rows.find(row=>row.id===-p.id);
 const currentRow=current?.rows.find(row=>row.id===-p.id);
 const photoSource=p.imageUrl||p.imageUrls?.length?p:group.products.find(product=>product.imageUrl||product.imageUrls?.length)||p;
 const inGroup=group.products.filter(product=>lines.some(line=>line.id===-product.id));
 const combined=pricingKey(p).startsWith('category:')||pricingKey(p).startsWith('group:');
 return <article className={styles.card} aria-labelledby={`${inputId}-title`}>
  <div className={styles.media}>
   <StorePhoto images={photoSource.imageUrls} src={photoSource.imageUrl} name={p.name}><SockVisual product={p}/></StorePhoto>
   <span className={`${styles.stock}${Math.floor(p.currentStock/packSize)?'':` ${styles.soldOut}`}`}>{Math.floor(p.currentStock/packSize)?`${Math.floor(p.currentStock/packSize)} ${units} disponibles`:'Agotado'}</span>
  </div>
  <div className={styles.info}>
   <ProductViewEvent id={p.id} kind="product"/>
   <p className={styles.kicker}>{group.byModel?group.category:`${group.products.length} ${group.products.length===1?'opción':'opciones'}`}</p>
   <h2 id={`${inputId}-title`}>{group.title}</h2>
   {(()=>{const colors=groupColors(group);return colors.length>0&&<p className={styles.colorSummary} aria-label={`Colores: ${colors.map(color=>color.value).join(', ')}`}>
    <span>{colors.length===1?'Color':`${colors.length} colores`}</span>
    {colors.map(color=><i key={color.value} className={`${styles.swatch}${color.available?'':` ${styles.swatchOut}`}`} style={colorSwatch(color.value)?{background:colorSwatch(color.value)!}:undefined} title={`${color.value}${color.available?'':' (agotado)'}`}/>)}
    <small>{colors.map(color=>color.value).join(' · ')}</small>
   </p>;})()}
   <p className={styles.variantName}>{[genderLabel(p.gender),productColor(p),p.details?.sizeRange||p.size&&`Talla ${p.details?.sizeRange||p.size}`].filter(Boolean).join(' · ')||p.name}</p>
   {group.dimensions.map(dimension=>{
    // En cascada: solo lo que existe con lo elegido antes (género → color → talla).
    const options=optionsFor(group,dimension,choice);
    if(options.length===1)return <p key={dimension} className={styles.single}>{DIMENSION_LABELS[dimension]}: <b>{dimension==='color'&&<i className={styles.swatch} style={colorSwatch(options[0].value)?{background:colorSwatch(options[0].value)!}:undefined} aria-hidden="true"/>}{options[0].label}</b>{!options[0].available&&<span> · agotado</span>}</p>;
    return <fieldset key={dimension} className={styles.options}>
     <legend>{DIMENSION_LABELS[dimension]}: <b>{choice[dimension]||'Elige'}</b></legend>
     <div>{options.map(option=>{
      const active=(choice[dimension]||'').toLowerCase()===option.value.toLowerCase();
      const swatch=dimension==='color'?colorSwatch(option.value):null;
      return <button key={option.value} type="button" aria-pressed={active}
       className={`${styles.option}${active?` ${styles.optionActive}`:''}${option.available?'':` ${styles.optionUnavailable}`}`}
       title={option.available?`${option.stock} disponibles`:'Agotado'}
       aria-label={`${option.label}${option.available?'':' (agotado)'}`}
       onClick={()=>pick(dimension,option.value)}>
       {dimension==='color'&&<i className={styles.swatch} style={swatch?{background:swatch}:undefined} aria-hidden="true"/>}
       {option.label}
      </button>;
     })}</div>
    </fieldset>;
   })}
   {(p.details?.material||p.details?.height||p.composition?.length)&&<details className={styles.details}><summary>Detalles del producto</summary>
    <dl>{p.details?.material&&<><dt>Material</dt><dd>{p.details.material}</dd></>}{p.details?.height&&<><dt>Altura</dt><dd>{p.details.height}</dd></>}</dl>
    {!!p.composition?.length&&<ul>{p.composition.map((part,index)=><li key={index}>{part}</li>)}</ul>}
   </details>}
  </div>
  <div className={styles.buy}>
   <div className={styles.price}>
    {valid&&proposedRow?.price!=null?<><small>Tu precio al agregar</small><strong>{money(saleUnitPrice(proposedRow.price,p))}</strong><small>MXN por {unit} · IVA incluido</small></>
     :<small>{Math.floor(p.currentStock/packSize)?'Elige una cantidad disponible para calcular tu precio.':'Esta combinación está agotada. Elige otra opción.'}</small>}
   </div>
   <PriceTable product={p} count={count}/>
   <p className={styles.scope}>{combined?`Sumamos todos los ${units} de ${pricingName(p).toLocaleLowerCase('es-MX')} de tu carrito, sin importar género o color, para darte el mejor precio.`:`El precio se calcula con la cantidad total de esta opción en tu carrito.`}{packSize===3?' 1 tripar = 3 pares.':''}</p>
   <div className="original-quantity-row">
    <label htmlFor={inputId}>Cantidad <small>({units})</small></label>
    <div className="original-stepper">
     <button type="button" aria-label="Reducir cantidad" disabled={amount<=1} onClick={()=>setAmount(n=>Math.max(1,n-1))}><Minus size={14}/></button>
     <QuantityInput id={inputId} min="1" max={max||1} value={amount} onChange={event=>setAmount(Number(event.target.value))}/>
     <button type="button" aria-label="Aumentar cantidad" disabled={amount>=max} onClick={()=>setAmount(n=>Math.min(max,n+1))}><Plus size={14}/></button>
    </div>
   </div>
   {valid&&proposedRow?.price!=null&&<p className={styles.subtotal}>{saleQuantityLabel(pairAmount,p)} · Subtotal <b>{money(Math.round(proposedRow.price*100)*pairAmount/100)}</b></p>}
   <button type="button" className="original-add" disabled={!valid||proposedRow?.price==null} onClick={()=>change(-p.id,quantity+pairAmount)}>
    {Math.floor(p.currentStock/packSize)?'Agregar a mi carrito':'Sin disponibilidad'}<ArrowUpRight size={17}/>
   </button>
   {!valid&&Math.floor(p.currentStock/packSize)>0&&<p className={styles.hint} role="status">{incomplete?'Falta verificar un paquete de tu carrito.':max<1?'Ya agregaste todas las existencias de esta opción.':`Escribe entre 1 y ${max} ${units}.`}</p>}
   {quantity>0&&<div className={styles.inCart}><span>{saleQuantityLabel(quantity,p)} de esta opción en tu carrito{currentRow?.total!=null?` · ${money(currentRow.total)}`:''}</span><button type="button" onClick={()=>change(-p.id,0)}>Quitar</button></div>}
   {inGroup.length>1&&<p className={styles.hint}>En tu carrito: {inGroup.map(product=>`${saleQuantityLabel(lines.find(line=>line.id===-product.id)?.quantity||0,product)} ${[genderLabel(product.gender),productColor(product),product.size].filter(Boolean).join(' ')}`).join(' · ')}</p>}
  </div>
 </article>;
}
