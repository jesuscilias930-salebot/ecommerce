"use client";
import {useEffect,useState} from 'react';
import {cartInput,type CartQuote} from '@/lib/cart-quote';
export function useCartQuote(lines:{id:number;quantity:number}[],enabled=true){
 const key=JSON.stringify(cartInput(lines)),[retry,setRetry]=useState(0),[result,setResult]=useState<{key:string;quote?:CartQuote;error?:string}>({key:''});
 useEffect(()=>{
  if(!enabled||!lines.length)return;
  const abort=new AbortController();
  const timer=setTimeout(()=>{fetch('/api/cart-quote',{method:'POST',headers:{'Content-Type':'application/json'},body:key,signal:abort.signal}).then(async r=>{
   const q=await r.json();if(!r.ok)throw Error(q.error||'No pudimos cotizar tu pedido');
   const requested=JSON.parse(key),expected=[...requested.products.map((p:{productId:number;quantity:number})=>({kind:'PRODUCT',id:p.productId,quantity:p.quantity})),...requested.bundles.map((b:{bundleId:number;quantity:number})=>({kind:'BUNDLE',id:b.bundleId,quantity:b.quantity}))];
   if(!Array.isArray(q.lines)||q.lines.length!==expected.length||!Array.isArray(q.groups)||!Number.isFinite(q.subtotal)||q.subtotal<0||expected.some(l=>q.lines.filter((v:CartQuote['lines'][number])=>v.kind===l.kind&&v.itemId===l.id&&v.quantity===l.quantity&&Number.isFinite(v.unitPrice)&&v.unitPrice>=0&&Number.isFinite(v.subtotal)&&v.subtotal>=0).length!==1))throw Error('Cotización incompleta. Reintenta.');
   return q as CartQuote;
  }).then(quote=>{if(!abort.signal.aborted)setResult({key,quote});}).catch(e=>{if(!abort.signal.aborted)setResult({key,error:e.message});});},250);
  return()=>{clearTimeout(timer);abort.abort();};
 },[key,retry,enabled,lines.length]);
 return {quote:enabled&&lines.length>0&&result.key===key?result.quote:undefined,quoteError:result.key===key?result.error:undefined,retryQuote:()=>{setResult({key:''});setRetry(n=>n+1);}};
}
