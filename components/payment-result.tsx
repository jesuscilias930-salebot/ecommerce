'use client';
import {useContext,useEffect,useState} from 'react';
import {Context} from './shop';
import Link from 'next/link';
type Result={testMode:boolean;folio:string;status:string;subtotal:number;shippingAmount?:number|null;total?:number};
export function PaymentResult({sessionId}:{sessionId:string}){
 const {completePurchase}=useContext(Context);
 const [data,setData]=useState<Result|null>(null),[error,setError]=useState(''),[revision,setRevision]=useState(0);
 useEffect(()=>{
  const abort=new AbortController();let timer:ReturnType<typeof setTimeout>;let attempts=0;
  async function check(){
   try{
    const response=await fetch('/api/payment-status?session_id='+encodeURIComponent(sessionId),{cache:'no-store',signal:abort.signal});
    const result=await response.json();if(!response.ok)throw Error(result.error);
    if(abort.signal.aborted)return;setData(result);setError('');
    if(!['PAID','PAID_TEST','PAYMENT_FAILED','PAYMENT_EXPIRED'].includes(result.status)&&++attempts<30)timer=setTimeout(check,3000);
   }catch(e){if(!abort.signal.aborted)setError(e instanceof Error?e.message:'No se pudo verificar el pago.');}
  }
  void check();return()=>{abort.abort();clearTimeout(timer);};
 },[sessionId,revision]);
 const paid=data?.status==='PAID_TEST'||data?.status==='PAID';
 useEffect(()=>{if(paid&&data?.folio)completePurchase(data.folio);},[paid,data?.folio,completePurchase]);
 return <section className="order-summary" style={{maxWidth:640,margin:'auto',overflowWrap:'anywhere'}}>
  <h1 style={{fontSize:32}}>{paid?(data?.testMode?'Pago de prueba confirmado':'Pago confirmado'):data?.status==='PAYMENT_FAILED'?'El pago no se completó':data?.status==='PAYMENT_EXPIRED'?'La sesión de pago expiró':'Verificando tu pago'}</h1>
  {data&&<p><strong>{data.folio}</strong><br/>Productos: {new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(data.subtotal))}</p>}
  <p role="status">{paid?(data?.testMode?'Stripe confirmó la prueba. No se cobró dinero real.':'Stripe confirmó tu pago y tu pedido ya se actualizó.'):'La confirmación depende de Stripe, no de haber llegado a esta página. No vuelvas a pagar mientras se verifica.'}</p>
  {data&&<p>Envío: {data.shippingAmount!=null?new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(data.shippingAmount)):'No incluido en este pedido'}<br/><strong>Total: {new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(data.total??data.subtotal))}</strong></p>}
  <p>Impuestos incluidos. Pagar el envío no genera la guía: la tienda la preparará internamente.</p>
  {error&&<p role="alert">{error}</p>}
  {!paid&&<button className="primary" onClick={()=>setRevision(n=>n+1)}>Consultar de nuevo</button>}
  <Link className="text-link" href="/carrito">Volver al carrito</Link>
  {paid&&<Link className="primary" href="/productos">Hacer otra compra</Link>}
 </section>;
}
