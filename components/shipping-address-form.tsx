'use client';
import {addressLimits,ShippingAddress} from '@/lib/shipping-address';
import styles from './shipping-address.module.css';
import {useState} from 'react';
import Link from 'next/link';
import {PostalCodeFields} from './postal-code-fields';
const fields:{key:keyof ShippingAddress;label:string;auto?:string;type?:string;optional?:boolean}[]=[
 {key:'recipient',label:'Nombre de quien recibe',auto:'shipping name'},
 {key:'phone',label:'Teléfono de contacto',auto:'shipping tel',type:'tel'},
 {key:'email',label:'Correo de contacto',auto:'shipping email',type:'email'},
 {key:'street',label:'Calle',auto:'shipping address-line1'},
 {key:'exteriorNumber',label:'Número exterior (o S/N)'},
 {key:'interiorNumber',label:'Número interior',optional:true},
 {key:'references',label:'Referencias para encontrar el domicilio',optional:true}
];
export function ShippingAddressForm({value,onChange,onContinue,onBack,busy,blocked=false,quoteMode=false}:{value:ShippingAddress;onChange:(v:ShippingAddress)=>void;onContinue:()=>void;onBack:()=>void;busy:boolean;blocked?:boolean;quoteMode?:boolean}){
 const [locationValid,setLocationValid]=useState(false);
 const renderField=(f:typeof fields[number])=><label key={f.key} htmlFor={'shipping-'+f.key} className={['email','street','references'].includes(f.key)?styles.wide:undefined}>{f.label}{f.optional?<span className={styles.optional}>Opcional</span>:<span aria-hidden="true"> *</span>}
   <input id={'shipping-'+f.key} name={f.key} value={value[f.key]} type={f.type||'text'} autoComplete={f.auto||'off'} required={!f.optional} maxLength={f.key==='phone'?24:addressLimits[f.key]} disabled={busy} inputMode={f.key==='phone'?'tel':undefined} placeholder={f.key==='phone'?'272 123 4567':undefined} aria-describedby={f.key==='phone'?'shipping-phone-hint':undefined} onChange={e=>onChange({...value,[f.key]:e.target.value})}/>
   {f.key==='phone'&&<small id="shipping-phone-hint">México: escribe tus 10 dígitos; agregamos +52 automáticamente. Para otro país, incluye su código.</small>}
  </label>;
 return <form className={styles.form} onSubmit={e=>{e.preventDefault();if(locationValid&&!busy&&!blocked)onContinue();}}>
  <p className={styles.intro}>Sin crear una cuenta. Los campos con * son obligatorios.</p>
  <p className={styles.intro}>Jesús Merlyn Cilias Arellano, responsable de Merlyn Mayoreo, utilizará tus datos para cotizar, gestionar y entregar tu pedido. Consulta el <Link href="/privacidad">aviso de privacidad</Link> antes de completarlos. La publicidad es opcional.</p>
  <fieldset className={styles.block}><legend><span>1</span> ¿Quién recibe?</legend><p>Usaremos estos datos para la entrega de tu pedido.</p><div className={styles.fields}>{fields.slice(0,3).map(renderField)}</div></fieldset>
  <fieldset className={styles.block}><legend><span>2</span> ¿A dónde lo enviamos?</legend><p>Escribe tu código postal para encontrar tu ciudad y colonia.</p><div className={styles.fields}><PostalCodeFields value={value} onChange={onChange} busy={busy} onValid={setLocationValid}/>{fields.slice(3).map(renderField)}</div></fieldset>
  <div className={styles.actions}><button className="primary" disabled={busy||blocked||!locationValid} type="submit">{quoteMode?(busy?'Buscando opciones…':'Ver opciones de envío →'):(busy?'Preparando pago…':'Continuar al pago →')}</button><small>Consulta los precios antes de pagar. Cotizar no genera cargos.</small><button className={styles.back} disabled={busy} type="button" onClick={onBack}>← Volver al carrito</button></div>
 </form>;
}
