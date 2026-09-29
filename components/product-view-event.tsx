'use client';
import {useEffect,useRef} from 'react';
import {trackStoreEvent} from '@/lib/store-events';
export function ProductViewEvent({id,kind='bundle'}:{id:number;kind?:'bundle'|'product'}){
 const anchor=useRef<HTMLSpanElement>(null);
 useEffect(()=>{
  let visible=kind==='bundle';
  const send=()=>{if(visible)void trackStoreEvent('ViewContent',{id:kind==='product'?-id:id},`view:${kind}:${id}`);};
  const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);send();});
  if(anchor.current&&kind==='product')observer.observe(anchor.current);
  window.addEventListener('merlyn:analytics-ready',send);send();
  return()=>{observer.disconnect();window.removeEventListener('merlyn:analytics-ready',send);};
 },[id,kind]);
 return <span ref={anchor} aria-hidden="true" style={{display:'block',height:1}}/>;
}
