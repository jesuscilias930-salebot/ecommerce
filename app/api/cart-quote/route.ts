import {stockApi,getOriginals,isProductDemo} from '@/lib/product-catalog';
import {getCatalog} from '@/lib/catalog';
import {demoCartQuote,validCartInput,type CartInput} from '@/lib/cart-quote';
export async function POST(request:Request){
 try{
  const body=await request.json() as CartInput;
  if(!validCartInput(body))return Response.json({error:'Cantidades inválidas'},{status:400});
  const input={products:body.products.map(({productId,quantity})=>({productId,quantity})),bundles:body.bundles.map(({bundleId,quantity})=>({bundleId,quantity}))};
  const mock=isProductDemo()||process.env.STOREFRONT_BUNDLES_MOCK==='true';
  const quote=mock?demoCartQuote(input,await getOriginals(),(await getCatalog()).packages):await stockApi('/public/store/cart-quote',input);
  return Response.json(quote,{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'No pudimos cotizar el pedido completo. Revisa existencias y reglas de precios o reintenta.'},{status:422});}
}
