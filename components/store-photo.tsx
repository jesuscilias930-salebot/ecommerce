"use client";
import { useRef, useState, type ReactNode } from "react";
import styles from "./store-photo.module.css";
export function StorePhoto({src,images,name,children,zoom=false}:{src?:string|null;images?:string[]|null;name:string;children:ReactNode;zoom?:boolean}) {
  const photos=Array.from(new Set([src,...(images||[])].filter((url):url is string=>typeof url==='string'&&url.length>0)));
  return <PhotoGallery key={photos.join('|')} photos={photos} name={name} zoom={zoom}>{children}</PhotoGallery>;
}
function PhotoGallery({photos,name,children,zoom}:{photos:string[];name:string;children:ReactNode;zoom:boolean}) {
  const [index,setIndex]=useState(0);
  const [failed,setFailed]=useState<Set<string>>(()=>new Set());
  const track=useRef<HTMLDivElement>(null);
  const multiple=photos.length>1;
  const move=(next:number)=>{
    const node=track.current;
    if(node)node.scrollTo({left:Math.max(0,Math.min(photos.length-1,next))*node.clientWidth,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  };
  return <div className={`${styles.frame}${zoom?` ${styles.zoomable}`:''}`} role="region" aria-label={`Fotografías de ${name}`} aria-roledescription="carrusel">
    <div ref={track} className={styles.track} tabIndex={multiple?0:undefined}
      aria-label={multiple?'Desliza o usa las flechas del teclado para ver las fotos':undefined}
      onKeyDown={event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();move(index+(event.key==='ArrowRight'?1:-1));}}}
      onScroll={event=>{const node=event.currentTarget;if(node.clientWidth)setIndex(Math.max(0,Math.min(photos.length-1,Math.round(node.scrollLeft/node.clientWidth))));}}>
      {(photos.length?photos:[null]).map((url,i)=><div key={url||'placeholder'} className={styles.slide} role="group" aria-label={`${i+1} de ${Math.max(1,photos.length)}`}
        onPointerMove={event=>{
          if(!zoom||event.pointerType!=='mouse')return;
          const rect=event.currentTarget.getBoundingClientRect();
          const surface=event.currentTarget.firstElementChild as HTMLElement;
          surface.style.transformOrigin=`${Math.max(0,Math.min(100,(event.clientX-rect.left)/rect.width*100))}% ${Math.max(0,Math.min(100,(event.clientY-rect.top)/rect.height*100))}%`;
        }} onPointerLeave={event=>{(event.currentTarget.firstElementChild as HTMLElement).style.transformOrigin='50% 50%';}}>
        <div className={styles.surface}>
          {/* Native images support private S3 signed URLs without proxy caching. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {url&&!failed.has(url)?<img src={url} alt={`${name}${multiple?` · Foto ${i+1}`:''}`} draggable={false} loading="lazy" onError={()=>setFailed(current=>new Set(current).add(url))}/>:children}
        </div>
      </div>)}
    </div>
    {multiple&&<>
      <button className={`${styles.arrow} ${styles.previous}`} type="button" aria-label={`Foto anterior de ${name}`} disabled={index===0} onClick={()=>move(index-1)}>‹</button>
      <button className={`${styles.arrow} ${styles.next}`} type="button" aria-label={`Foto siguiente de ${name}`} disabled={index===photos.length-1} onClick={()=>move(index+1)}>›</button>
      <span className={styles.counter} aria-live="polite" aria-atomic="true">{index+1} / {photos.length}</span>
    </>}
    {zoom&&<span className={styles.hint} aria-hidden="true">⊕ Pasa el cursor para ampliar</span>}
  </div>;
}
