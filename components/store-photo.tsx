"use client";
import { useRef, useState, type ReactNode } from "react";
import styles from "./store-photo.module.css";
export function StorePhoto({src,name,children,zoom=false}:{src?:string|null;name:string;children:ReactNode;zoom?:boolean}) {
  const [failed,setFailed]=useState<string|null>(null);
  const surface=useRef<HTMLDivElement>(null);
  // Native img allows temporary S3 links without a public bucket or image proxy cache.
  // eslint-disable-next-line @next/next/no-img-element
  return <div className={`${styles.frame}${zoom ? ` ${styles.zoomable}` : ""}`} onPointerMove={event=>{
    if(!zoom||event.pointerType!=="mouse")return;
    const rect=event.currentTarget.getBoundingClientRect();
    if(surface.current)surface.current.style.transformOrigin=`${Math.max(0,Math.min(100,(event.clientX-rect.left)/rect.width*100))}% ${Math.max(0,Math.min(100,(event.clientY-rect.top)/rect.height*100))}%`;
  }} onPointerLeave={()=>{if(surface.current)surface.current.style.transformOrigin="50% 50%";}}>
    <div ref={surface} className={styles.surface}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src&&failed!==src ? <img src={src} alt={name} loading="lazy" onError={()=>setFailed(src)} /> : children}
    </div>
    {zoom && <span className={styles.hint} aria-hidden="true">⊕ Pasa el cursor para ampliar</span>}
  </div>;
}
