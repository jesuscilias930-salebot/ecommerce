"use client";
import { useId, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import styles from "./cart-quantity.module.css";

export function CartQuantity({name,quantity,max,unit,onChange}:{name:string;quantity:number;max:number;unit:"pares"|"cajas";onChange:(quantity:number)=>void}) {
  const id=useId();
  const [draft,setDraft]=useState<string|null>(null);
  const [error,setError]=useState("");
  const [confirm,setConfirm]=useState(false);
  const limit=Math.max(0,Math.min(100000,Math.floor(max)));
  function commit(){
    if(draft===null)return;
    const next=Number(draft);
    if(!draft.trim()||!Number.isInteger(next)||next<1||next>limit){
      setError(limit?`Escribe una cantidad entre 1 y ${limit}.` : "Este artículo ya no tiene existencias disponibles.");
      setDraft(null);return;
    }
    setError("");setDraft(null);onChange(next);
  }
  function step(delta:number){
    const typed=draft===null?quantity:Number(draft);
    const base=Number.isInteger(typed)&&typed>=1&&typed<=limit?typed:quantity;
    setDraft(null);setError("");
    onChange(delta<0?Math.max(1,base-1):Math.min(limit,base+1));
  }
  return <div className={styles.wrapper}>
    <div className={styles.row}>
      <div><label htmlFor={id} className={styles.label}>Cantidad de {unit}</label>
        <div className={styles.stepper}>
          <button type="button" disabled={quantity<=1||!limit} aria-label={`Reducir una unidad de ${name}`} onMouseDown={e=>e.preventDefault()} onClick={()=>step(-1)}><Minus size={18}/></button>
          <input id={id} type="text" inputMode="numeric" pattern="[0-9]*" aria-label={`Cantidad de ${name}`} aria-describedby={`${id}-hint`} aria-invalid={!!error} value={draft??String(quantity)} onChange={e=>{setDraft(e.target.value);setError("");}} onBlur={commit} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();commit();}if(e.key==="Escape"){setDraft(null);setError("");}}}/>
          <button type="button" disabled={quantity>=limit} aria-label={`Agregar una unidad de ${name}`} onMouseDown={e=>e.preventDefault()} onClick={()=>step(1)}><Plus size={18}/></button>
        </div>
      </div>
      <button type="button" className={styles.remove} onClick={()=>setConfirm(true)}><Trash2 size={15}/> Eliminar artículo</button>
    </div>
    <p id={`${id}-hint`} className={styles.hint}>{limit===0?"Sin disponibilidad. Puedes eliminar este artículo.":quantity>limit?`Solo hay ${limit} ${unit}. Ajusta la cantidad.`:quantity===limit?`Agregaste todos los ${unit} disponibles.`:''}</p>
    {error&&<p role="alert" className={styles.error}>{error}</p>}
    {confirm&&<div className={styles.confirm} role="group" aria-label={`Confirmar eliminación de ${name}`}><p>¿Eliminar todos los {quantity} {unit} de <b>{name}</b> del carrito?</p><button type="button" onClick={()=>onChange(0)}>Sí, eliminar artículo</button><button type="button" onClick={()=>setConfirm(false)}>Conservar</button></div>}
  </div>;
}
