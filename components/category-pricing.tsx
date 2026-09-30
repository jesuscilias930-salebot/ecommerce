import type {Original} from '@/lib/product-catalog';
import type {calculateGroups} from '@/lib/live-pricing';
import {pricingKey,shortProduct} from '@/lib/live-pricing';
import {money} from '@/lib/money';
import './category-pricing.css';

export function CategoryPricing({label,products,groups,incomplete}:{label:string;products:Original[];groups:ReturnType<typeof calculateGroups>;incomplete:boolean}) {
  // Keep independent products and models with different tariffs in separate columns.
  const columns:Original[][]=[];
  for(const product of products){
    const existing=columns.find(column=>pricingKey(column[0])===pricingKey(product)&&JSON.stringify(column[0].rules)===JSON.stringify(product.rules));
    if(existing)existing.push(product);else columns.push([product]);
  }
  const boundaries=[...new Set(products.flatMap(p=>p.rules.flatMap(r=>[r.minQuantity,...(r.maxQuantity!=null&&r.maxQuantity<2147483647?[r.maxQuantity+1]:[])])))].sort((a,b)=>a-b);
  const keys=new Set(products.map(pricingKey));
  const selected=groups.filter(group=>keys.has(group.key));
  const quantity=selected.reduce((sum,group)=>sum+group.quantity,0);
  const total=!incomplete&&selected.every(group=>group.total!==null)?selected.reduce((sum,group)=>sum+Math.round(group.total!*100),0)/100:null;
  const units=products.every(shortProduct)?'piezas':'pares';
  const combined=keys.size===1&&products.length>1;
  return <div className="category-pricing">
    <h3>{label} · Tu pedido</h3>
    <p className="category-pricing-explanation">{combined?`Combina géneros: todos los ${units} de esta categoría cuentan, incluidos tus paquetes.`:'Cada producto o grupo conserva su propia escala de mayoreo.'}</p>
    <div className="category-pricing-status" role="status" aria-live="polite" aria-atomic="true">
      <strong>{quantity} {units} en el carrito{!combined&&keys.size>1?' · escalas independientes':''}</strong>
      <span>Subtotal de individuales: <b>{total===null?'Por verificar':money(total)}</b></span>
    </div>
    <div className="category-current-rates" aria-live="polite" aria-label="Precios actuales por modelo">
      {columns.map(column=>{
        const count=groups.find(group=>group.key===pricingKey(column[0]))?.quantity||0;
        const matches=column[0].rules.filter(rule=>count>=rule.minQuantity&&(rule.maxQuantity==null||count<=rule.maxQuantity));
        return count>0?<div key={column[0].id}><span>{columns.length===1?'Precio por '+(units==='pares'?'par':'pieza'):column.map(p=>p.name).join(' / ')}</span><strong>{!incomplete&&matches.length===1?money(Number(matches[0].pricePerUnit)):'Por verificar'}</strong></div>:null;
      })}
      {quantity===0&&<small>El precio al agregar aparece junto a la cantidad de cada producto.</small>}
    </div>
    <details className="category-price-details"><summary>Ver escalas de mayoreo</summary>
    <div className="category-pricing-scroll" tabIndex={0} role="region" aria-label="Tabla de precios por volumen; desplaza horizontalmente si es necesario">
      <table>
        <caption>Precios en MXN por {units==='pares'?'par':'pieza'}, IVA incluido. Envío aparte. {columns.length>2?'Desliza para ver todos los modelos.':''}</caption>
        <thead><tr><th scope="col">Cantidad para la escala</th>{columns.map(column=>{
          const group=groups.find(g=>g.key===pricingKey(column[0]));
          return <th scope="col" key={column[0].id}>{columns.length===1&&column.length>1?'Todos los modelos y géneros':column.map(p=>p.name).join(' / ')}<small>{group?.quantity||0} {units} acumulados</small></th>;
        })}</tr></thead>
        <tbody>{boundaries.map((min,index)=>{
          const max=boundaries[index+1]!=null?boundaries[index+1]-1:null;
          return <tr key={min}><th scope="row">{max===null?`${min} o más`:`${min}–${max}`} {units}</th>{columns.map(column=>{
            const rules=column[0].rules.filter(rule=>min>=rule.minQuantity&&(rule.maxQuantity==null||min<=rule.maxQuantity));
            const quantity=groups.find(g=>g.key===pricingKey(column[0]))?.quantity||0;
            const active=!incomplete&&quantity>=min&&(max===null||quantity<=max)&&rules.length===1;
            return <td key={column[0].id} className={active?'category-price-active':undefined}>{rules.length===1?money(Number(rules[0].pricePerUnit)):'—'}{active&&<small>✓ Tu tarifa actual</small>}</td>;
          })}</tr>;
        })}</tbody>
      </table>
    </div>
    <small>Las tarifas se actualizan al agregar o quitar productos. El subtotal es solo de individuales; las cajas también cuentan para alcanzar la escala.</small>
    </details>
    <small className="category-price-footer">{incomplete?'Falta verificar un paquete. Revisa tu carrito.':'MXN · IVA incluido · Envío aparte. Confirmamos existencias en el carrito.'}</small>
  </div>;
}
