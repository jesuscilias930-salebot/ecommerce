import { validateAddress } from '@/lib/shipping-address';
import { getStoreTenant } from '@/lib/store-tenant';

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin)
    return Response.json({error:'Origen no permitido'},{status:403});
  const headers={'Cache-Control':'no-store'};
  try {
    const raw=await request.text();
    if(raw.length>20000)return Response.json({error:'Pedido demasiado grande'},{status:413,headers});
    const body=JSON.parse(raw);
    if(!Array.isArray(body.products)||!Array.isArray(body.bundles)||body.products.length+body.bundles.length<1||body.products.length+body.bundles.length>200)throw Error('Revisa los productos de tu carrito.');
    for(const [key,idKey,max] of [['products','productId',100000],['bundles','bundleId',1000]] as const)
      for(const item of body[key])if(!item||!Number.isSafeInteger(item[idKey])||item[idKey]<1||!Number.isSafeInteger(item.quantity)||item.quantity<1||item.quantity>max)throw Error('Cantidad inválida.');
    const base=process.env.SOCK_CONTROL_URL;
    if(!base || (body.products.length&&process.env.STOREFRONT_PRODUCTS_MOCK==='true') || (body.bundles.length&&process.env.STOREFRONT_BUNDLES_MOCK==='true'))throw Error('Las tarifas reales requieren productos del inventario, no datos de demostración.');
    const payload={destination:validateAddress(body.destination),products:body.products.map((p:{productId:number;quantity:number})=>({productId:p.productId,quantity:p.quantity})),bundles:body.bundles.map((b:{bundleId:number;quantity:number})=>({bundleId:b.bundleId,quantity:b.quantity}))};
    const response=await fetch(`${base.replace(/\/$/,'')}/public/store/shipping-quote`,{method:'POST',headers:{'Content-Type':'application/json','X-Store-Tenant':await getStoreTenant()},body:JSON.stringify(payload),cache:'no-store',signal:AbortSignal.timeout(45000)});
    const data=await response.json().catch(()=>null);
    if(!response.ok)return Response.json({error:response.status===400&&typeof data?.message==='string'?data.message:'No pudimos consultar el envío. Intenta nuevamente en un momento.'},{status:response.status===429?429:400,headers});
    return Response.json(data,{headers});
  } catch(error) {
    return Response.json({error:error instanceof Error && !['TypeError','SyntaxError','TimeoutError','AbortError'].includes(error.name)?error.message:'No pudimos cotizar el envío. Revisa tu conexión e intenta nuevamente.'},{status:400,headers});
  }
}
