"use client";

import {useRef,useState} from 'react';
import styles from './testimonial-gallery.module.css';

export function TestimonialGallery({photos}:{photos:{id:number;url:string}[]}) {
 const dialog=useRef<HTMLDialogElement>(null);
 const [selected,setSelected]=useState<{id:number;url:string}|null>(null);
 function open(photo:{id:number;url:string}){setSelected(photo);dialog.current?.showModal();}
 return <>
  <div className={styles.grid}>{photos.map((photo,index)=><figure key={photo.id} className={styles.card}>
   <button type="button" className={styles.preview} onClick={()=>open(photo)} aria-label={`Ampliar referencia de compra ${index+1}`}>
    <img src={photo.url} alt={`Captura compartida por un cliente, referencia ${index+1}`} loading="lazy"/>
    <span className={styles.hint}>Ampliar captura ↗</span>
   </button>
  </figure>)}</div>
  <dialog ref={dialog} className={styles.dialog} aria-label="Referencia de compra ampliada" onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close();}}>
   <div className={styles.toolbar}><span>Referencia de compra</span><button type="button" onClick={()=>dialog.current?.close()} autoFocus>Cerrar ✕</button></div>
   <div className={styles.viewer}>{selected&&<img src={selected.url} alt="Captura completa de referencia de compra"/>}</div>
  </dialog>
 </>;
}
