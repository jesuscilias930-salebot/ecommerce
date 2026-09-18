import {stockApi} from '@/lib/product-catalog';
export async function POST(request:Request) {
 try {
 const body=await request.json();
 if(!Array.isArray(body)||!body.length||body.length>200||body.some(l=>!l||!Number.isInteger(l.productId)||l.productId<1||!Number.isInteger(l.quantity)||l.quantity<1||l.quantity>100000)) return Response.json({error:'Cantidades inválidas'},{status:400});
 const quote=await stockApi('/public/store/quote',body.map(({productId,quantity})=>({productId,quantity})));
 return Response.json(quote,{headers:{'Cache-Control':'no-store'}});
 }catch {return Response.json({error:'No pudimos cotizar: verifica disponibilidad y reglas de precios.'},{status:422});}
}
