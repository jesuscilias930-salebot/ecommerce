import { getStoreTenant } from '@/lib/store-tenant';
export async function GET(_request:Request,{params}:{params:Promise<{postalCode:string}>}){
 const {postalCode}=await params;
 const headers={'Cache-Control':'no-store'};
 if(!/^\d{5}$/.test(postalCode))return Response.json({error:'Escribe un código postal de 5 dígitos.'},{status:400,headers});
 const base=process.env.SOCK_CONTROL_URL;
 if(!base)return Response.json({error:'La búsqueda de códigos postales no está configurada.'},{status:503,headers});
 try{
  const response=await fetch(`${base.replace(/\/$/,'')}/public/store/postal-codes/${postalCode}`,{headers:{'X-Store-Tenant':await getStoreTenant()},cache:'no-store',signal:AbortSignal.timeout(12000)});
  const data=await response.json().catch(()=>null);
  if(!response.ok)return Response.json({error:response.status===400&&typeof data?.message==='string'?data.message:'No se pudo consultar el código postal. Intenta nuevamente.'},{status:response.status===429?429:400,headers});
  return Response.json(data,{headers});
 }catch{return Response.json({error:'No se pudo conectar con la búsqueda de códigos postales. Intenta nuevamente.'},{status:502,headers});}
}
