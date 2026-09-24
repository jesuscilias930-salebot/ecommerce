import 'server-only';
import {getStoreTenant} from '@/lib/store-tenant';
import {TestimonialGallery} from './testimonial-gallery';
type Photo={id:number;url:string};
export async function TestimonialPhotos({limit}:{limit?:number}) {
 let photos:Photo[]=[];
 try {
  const base=process.env.SOCK_CONTROL_URL;
  if(!base)return null;
  const tenant=await getStoreTenant();
  const response=await fetch(`${base.replace(/\/$/,'')}/public/store/testimonials`,{headers:{'X-Store-Tenant':tenant},cache:'no-store',signal:AbortSignal.timeout(5000)});
  if(!response.ok)return null;
  const data:unknown=await response.json();
  if(Array.isArray(data)) photos=data.filter((p):p is Photo=>p&&typeof p.id==='number'&&typeof p.url==='string'&&p.url.startsWith('https://'));
 }catch{return null;}
 if(!photos.length)return null;
 return <div><h2>Fotografías compartidas por nuestros clientes</h2><p>Publicadas con autorización. Toca una captura para ampliarla y leerla completa.</p><TestimonialGallery photos={photos.slice(0,limit??photos.length)}/></div>;
}
