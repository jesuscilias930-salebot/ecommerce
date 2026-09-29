import type {Original} from '@/lib/product-catalog';
import type {calculateGroups} from '@/lib/live-pricing';
import {pricingKey,shortProduct} from '@/lib/live-pricing';
import {money} from '@/lib/money';
import './category-pricing.css';

export function CategoryPricing({products,groups,incomplete}:{products:Original[];groups:ReturnType<typeof calculateGroups>;incomplete:boolean}) {
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
    <h3>Tu precio de mayoreo, en un solo lugar</h3>
    <p>{combined?`Los ${units} de estos modelos y géneros se suman para elegir la escala de precio de cada uno. También cuentan los de tus paquetes.`:'Cada grupo o producto tiene su propia escala. La tabla muestra por separado qué cantidad determina el precio de cada modelo, incluyendo tus paquetes.'}</p>
    <div className="category-pricing-status" role="status" aria-live="polite" aria-atomic="true">
      <strong>{quantity} {units} en el carrito{!combined&&keys.size>1?' · escalas independientes':''}</strong>
      <span>Subtotal de individuales: <b>{total===null?'Por verificar':money(total)}</b></span>
    </div>
    <p className="category-pricing-hint">Agrega productos abajo. La escala marcada cambia con tu carrito. Para quitar unidades, usa «Quitar» en cada producto.</p>
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
    <small>{incomplete?'Falta información de un paquete del carrito. Verifica el pedido en el carrito antes de continuar.':'Vista previa según las reglas disponibles; confirmamos precio y existencias en el carrito. El subtotal no incluye las cajas.'}</small>
  </div>;
}
