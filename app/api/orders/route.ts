import {stockApi,isProductDemo} from '@/lib/product-catalog';
import {getCatalog} from '@/lib/catalog';
import {validateAddress} from '@/lib/shipping-address';
import {getStoreFeatures} from '@/lib/store-features';
import {isAllowedStoreOrigin} from '@/lib/store-origin.mjs';

const SALES_NUMBER='522721285563';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function POST(request:Request) {
 if(!isAllowedStoreOrigin(request,process.env.STOREFRONT_DOMAIN_TENANTS,process.env.NODE_ENV==='development'))return Response.json({error:'Origen no permitido'},{status:403,headers:{'Cache-Control':'no-store'}});
 try {
  const raw=await request.text();
  if(raw.length>20000)return Response.json({error:'Pedido demasiado grande'},{status:413});
  const b=JSON.parse(raw);
  const features=b?.payment==='stripe'?await getStoreFeatures():{cardPaymentsEnabled:false,metaEventsEnabled:false};
  if(b?.payment==='stripe'&&!features.cardPaymentsEnabled)return Response.json({error:'Los pagos con tarjeta no están disponibles. Concluye tu pedido por WhatsApp.'},{status:403});
  let shippingAddress;
  try{if(b.payment==='stripe'||b.shippingAddress)shippingAddress=validateAddress(b.shippingAddress);}catch(e){return Response.json({error:e instanceof Error?e.message:'Dirección inválida'},{status:400});}
  if(b?.payment!==undefined&&b.payment!=='stripe'&&b.payment!=='whatsapp')throw Error('Invalid payment');
  if(!b||typeof b.requestId!=='string'||!UUID.test(b.requestId)||!Array.isArray(b.products)||!Array.isArray(b.bundles)||b.products.length+b.bundles.length<1||b.products.length+b.bundles.length>200)throw Error('Invalid');
  if(b.products.some((l:{productId:number;quantity:number})=>!l||!Number.isInteger(l.productId)||l.productId<=0||!Number.isInteger(l.quantity)||l.quantity<1||l.quantity>100000)||b.bundles.some((l:{bundleId:number;quantity:number})=>!l||!Number.isInteger(l.bundleId)||l.bundleId<=0||!Number.isInteger(l.quantity)||l.quantity<1||l.quantity>1000))throw Error('Invalid');
  if((b.products.length&&isProductDemo())||(b.bundles.length&&(await getCatalog()).demo))return Response.json({error:'Los pedidos de demostración no se guardan.'},{status:400});
  // Prices, combined stock and tenant are checked by SockControl. No customer identity is fabricated.
  if(b.payment==='stripe'&&b.products.length+b.bundles.length>100)return Response.json({error:'Stripe admite hasta 100 líneas por pedido. Continúa por WhatsApp.'},{status:400});
  const order=await stockApi(b.payment==='stripe'?'/public/store/checkout':'/public/store/orders',{
   requestId:b.requestId,
   marketing:b.payment==='stripe'&&features.metaEventsEnabled&&b.marketing?.consent===true?{
    consent:true,
    fbp:typeof b.marketing.fbp==='string'?b.marketing.fbp.slice(0,255):undefined,
    fbc:typeof b.marketing.fbc==='string'?b.marketing.fbc.slice(0,255):undefined,
    userAgent:(request.headers.get('user-agent')||'').slice(0,512)
   }:undefined,
   shippingAddress,
   shippingQuoteToken:typeof b.shippingQuoteToken==='string'&&b.shippingQuoteToken.length<=2048?b.shippingQuoteToken:undefined,
   products:b.products.map((l:{productId:number;quantity:number})=>({productId:l.productId,quantity:l.quantity})),
   bundles:b.bundles.map((l:{bundleId:number;quantity:number})=>({bundleId:l.bundleId,quantity:l.quantity}))
  });
  const expected='MS-'+b.requestId.toLowerCase();
  if(order.folio!==expected||!Number.isFinite(Number(order.subtotal)))throw Error('Invalid receipt');
  if(b.payment==='stripe'){
   if(typeof order.sessionId!=='string'||!/^cs_(test|live)_[A-Za-z0-9]+$/.test(order.sessionId))throw Error('Invalid session');
   if(order.checkoutUrl){const url=new URL(order.checkoutUrl);if(url.protocol!=='https:'||url.hostname!=='checkout.stripe.com')throw Error('Invalid redirect');}
   return Response.json({folio:order.folio,sessionId:order.sessionId,checkoutUrl:order.checkoutUrl||null},{headers:{'Cache-Control':'no-store'}});
  }
  return Response.json({folio:order.folio,status:order.status,subtotal:order.subtotal,whatsappUrl:'https://wa.me/'+SALES_NUMBER+'?text='+encodeURIComponent('Hola, quiero completar mi pedido '+order.folio+'.')},{headers:{'Cache-Control':'no-store'}});
 } catch {
  return Response.json({error:'No se pudo completar la solicitud. Verifica precios, existencias y la configuración de Stripe si elegiste pagar. Reintenta con el mismo pedido o continúa por WhatsApp.'},{status:400});
 }
}
