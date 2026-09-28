import 'server-only';
import {getStoreTenant} from '@/lib/store-tenant';
import {TestimonialGallery,PurchaseReferences} from './testimonial-gallery';
import {cache} from 'react';
type Photo={id:number;url:string};
export const getTestimonialPhotos=cache(async ():Promise<Photo[]>=>{
 let photos:Photo[]=[];
 try {
  const base=process.env.SOCK_CONTROL_URL;
  if(!base)return [];
  const tenant=await getStoreTenant();
  const response=await fetch(`${base.replace(/\/$/,'')}/public/store/testimonials`,{headers:{'X-Store-Tenant':tenant},cache:'no-store',signal:AbortSignal.timeout(5000)});
  if(!response.ok)return [];
  const data:unknown=await response.json();
  if(Array.isArray(data)) photos=data.filter((p):p is Photo=>p&&typeof p.id==='number'&&typeof p.url==='string'&&p.url.startsWith('https://'));
 }catch{return [];}
 return photos;
});
export async function TestimonialPhotos({limit,compact=false}:{limit?:number;compact?:boolean}) {
 const photos=await getTestimonialPhotos();
 if(!photos.length)return null;
 if(compact)return <PurchaseReferences photos={photos.slice(0,limit??2)}/>;
 return <div><h2>Fotografías compartidas por nuestros clientes</h2><p>Publicadas con autorización. Toca una captura para ampliarla y leerla completa.</p><TestimonialGallery photos={photos.slice(0,limit??photos.length)}/></div>;
}
