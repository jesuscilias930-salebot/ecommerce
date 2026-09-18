'use client';
import {useEffect,useRef,useState} from 'react';
import type {ShippingAddress} from '@/lib/shipping-address';
type Locality={stateCode:string;stateName:string;city:string;districts:string[]};
export function PostalCodeFields({value,onChange,busy,onValid}:{value:ShippingAddress;onChange:(v:ShippingAddress)=>void;busy:boolean;onValid:(valid:boolean)=>void}){
 const [result,setResult]=useState<{postalCode:string;localities:Locality[]}|null>(null);
 const [loading,setLoading]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 const latest=useRef({value,onChange,onValid});latest.current={value,onChange,onValid};
 const localities=result?.postalCode===value.postalCode?result.localities:[];
 const selected=localities.find(l=>(l.stateCode===value.state||l.stateName===value.state)&&l.city===value.city);
 const valid=!!selected&&selected.districts.includes(value.district);
 useEffect(()=>{latest.current.onValid(valid);},[valid]);
 useEffect(()=>{
  const postalCode=value.postalCode;
  setResult(null);setError('');latest.current.onValid(false);
  if(!/^\d{5}$/.test(postalCode)){setLoading(false);return;}
  const controller=new AbortController();setLoading(true);
  const timer=setTimeout(async()=>{
   try{
    const response=await fetch(`/api/postal-codes/${postalCode}`,{signal:controller.signal});const data=await response.json();
    if(!response.ok)throw Error(data.error||'No se pudo consultar el código postal.');
    if(data.postalCode!==postalCode||!Array.isArray(data.localities)||!data.localities.length)throw Error('No encontramos colonias para ese código postal.');
    if(controller.signal.aborted)return;
    setResult(data);
    const current=latest.current.value;
    if(current.postalCode!==postalCode)return;
    const locations=data.localities as Locality[];
    const match=locations.find(l=>(l.stateCode===current.state||l.stateName===current.state)&&l.city===current.city);
    const option=match||(locations.length===1?locations[0]:undefined);
    latest.current.onChange({...current,state:option?.stateCode||'',city:option?.city||'',district:option?.districts.includes(current.district)?current.district:''});
   }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'No se pudo consultar Envia.');}
   finally{if(!controller.signal.aborted)setLoading(false);}
  },350);
  return()=>{clearTimeout(timer);controller.abort();};
 },[value.postalCode,retry]);
 const stateCodes=[...new Set(localities.map(l=>l.stateCode))];
 function update(patch:Partial<ShippingAddress>){onChange({...value,...patch});}
 return <>
  <label htmlFor="shipping-postalCode">Código postal *<input id="shipping-postalCode" name="postalCode" autoComplete="shipping postal-code" value={value.postalCode} required pattern="[0-9]{5}" maxLength={5} inputMode="numeric" disabled={busy} onChange={e=>{latest.current.onValid(false);update({postalCode:e.target.value.replace(/\D/g,''),state:'',city:'',district:''});}}/></label>
  <label htmlFor="shipping-state">Estado *<select id="shipping-state" value={selected?.stateCode||value.state} required disabled={busy||loading||!localities.length} onChange={e=>{const options=localities.filter(l=>l.stateCode===e.target.value);update({state:e.target.value,city:options.length===1?options[0].city:'',district:''});}}><option value="">Selecciona un estado</option>{stateCodes.map(code=><option key={code} value={code}>{localities.find(l=>l.stateCode===code)!.stateName}</option>)}</select></label>
  <label htmlFor="shipping-city">Ciudad / municipio *<select id="shipping-city" value={value.city} required disabled={busy||loading||!value.state} onChange={e=>update({city:e.target.value,district:''})}><option value="">Selecciona una ciudad</option>{localities.filter(l=>l.stateCode===value.state||l.stateName===value.state).map(l=><option key={`${l.stateCode}-${l.city}`} value={l.city}>{l.city}</option>)}</select></label>
  <label htmlFor="shipping-district">Colonia *<select id="shipping-district" value={value.district} required disabled={busy||loading||!selected} onChange={e=>update({district:e.target.value})}><option value="">Selecciona tu colonia</option>{selected?.districts.map(d=><option key={d} value={d}>{d}</option>)}</select></label>
  {loading&&<p role="status">Buscando colonias en Envia…</p>}
  {error&&<p role="alert">{error} <button type="button" disabled={busy} onClick={()=>setRetry(n=>n+1)}>Reintentar</button></p>}
  {!loading&&!error&&localities.length>0&&<small>Estado y localidades verificados con Envia. Selecciona tu colonia.</small>}
 </>;
}
