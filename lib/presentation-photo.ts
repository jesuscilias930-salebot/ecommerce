import 'server-only';
import {getStoreTenant} from './store-tenant';
import {storeRequestIdentity} from './store-request-identity';
import {storeFetch} from './store-fetch';
export async function getPresentationPhoto():Promise<string|undefined>{
 const base=process.env.SOCK_CONTROL_URL;if(!base)return;
 try{
  const response=await storeFetch(`${base.replace(/\/$/,'')}/public/store/presentation`,'/public/store/presentation',{headers:{...await storeRequestIdentity(),'X-Store-Tenant':await getStoreTenant()},cache:'no-store',signal:AbortSignal.timeout(5000)});
  if(!response.ok)return;
  const photos:unknown=await response.json();
  if(Array.isArray(photos)&&typeof photos[0]?.url==='string'&&photos[0].url.startsWith('https://'))return photos[0].url;
 }catch{/* An unavailable photo must not block the storefront. */}
}
