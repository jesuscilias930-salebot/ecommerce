// Isolated UI fixtures. No DB, credentials, external APIs, orders or charges.
import {createServer} from 'node:http';
const rules=[{minQuantity:1,maxQuantity:49,pricePerUnit:10},{minQuantity:50,maxQuantity:99,pricePerUnit:9},{minQuantity:100,maxQuantity:null,pricePerUnit:8}];
const products=[{id:1,name:'CALCETA PRUEBA',gender:'Hombre',size:'Talla de prueba',category:'Caricatura',categoryId:1,currentStock:300,imageUrls:[]},{id:2,name:'CALCETA PRUEBA',gender:'Mujer',size:'Talla de prueba',category:'Caricatura',categoryId:1,currentStock:300,imageUrls:[]},{id:3,name:'TIN PRUEBA',gender:'Unisex',size:'Talla de prueba',category:'Deportivos',categoryId:2,currentStock:300,imageUrls:[]}];
const bundles=[{id:2,name:'PRUEBA LOCAL · Caja surtida 50 pares',storeCategory:'Caricatura',description:'Datos ficticios para revisar la interfaz. No se genera un pedido real.',fixedPrice:450,available:12,boxLengthCm:30,boxWidthCm:30,boxHeightCm:30,boxWeightKg:1.8,items:[{id:1,productId:1,productName:'CALCETA PRUEBA',gender:'Hombre',category:'Caricatura',categoryId:1,quantity:50,assignedUnitPrice:9,assorted:true}]}];
function quote(input){
 const articles=[...input.products.map(p=>({kind:'PRODUCT',itemId:p.productId,quantity:p.quantity,selection:null,parts:[{productId:p.productId,quantity:1}]})),...input.bundles.map(b=>({kind:'BUNDLE',itemId:b.bundleId,quantity:b.quantity,selection:b.selection||null,parts:b.selection||[{productId:1,quantity:50}]}))];
 const key=id=>id===3?'product:3':'category:1',totals={};
 for(const a of articles){if(a.quantity<1||a.parts.some(p=>p.quantity<1)||a.kind==='BUNDLE'&&a.parts.reduce((n,p)=>n+p.quantity,0)!==50)throw Error('Configuración inválida');for(const p of a.parts)totals[key(p.productId)]=(totals[key(p.productId)]||0)+p.quantity*a.quantity;}
 if(Object.values(totals).some(n=>n>600))throw Error('Existencias insuficientes');
 const lines=articles.map(a=>{const components=a.parts.map(p=>{const product=products.find(v=>v.id===p.productId);if(!product)throw Error('Producto no disponible');const groupQuantity=totals[key(p.productId)],unitPrice=groupQuantity>=100?8:groupQuantity>=50?9:10;return {productId:p.productId,name:a.kind==='BUNDLE'&&!a.selection?'Surtido automático según existencias':`${product.name} ${product.gender}`,categoryKey:key(p.productId),categoryName:product.category,quantity:p.quantity*a.quantity,perUnitQuantity:p.quantity,groupQuantity,unitPrice,subtotal:p.quantity*a.quantity*unitPrice};});const unitPrice=components.reduce((n,p)=>n+p.perUnitQuantity*p.unitPrice,0);return {kind:a.kind,itemId:a.itemId,name:a.kind==='BUNDLE'?bundles[0].name:components[0].name,quantity:a.quantity,selection:a.selection,components,unitPrice,subtotal:unitPrice*a.quantity,referenceSubtotal:null,savings:null};});
 return {lines,groups:Object.entries(totals).map(([key,quantity])=>({key,name:key==='product:3'?'Tin deportivo':'Caricatura',quantity,bundlePairs:lines.filter(l=>l.kind==='BUNDLE').flatMap(l=>l.components).filter(c=>c.categoryKey===key).reduce((n,c)=>n+c.quantity,0),individualPairs:lines.filter(l=>l.kind==='PRODUCT').flatMap(l=>l.components).filter(c=>c.categoryKey===key).reduce((n,c)=>n+c.quantity,0),subtotal:lines.flatMap(l=>l.components).filter(c=>c.categoryKey===key).reduce((n,c)=>n+c.subtotal,0)})),subtotal:lines.reduce((n,l)=>n+l.subtotal,0),totalPairs:Object.values(totals).reduce((a,b)=>a+b,0),savings:null};
}
createServer(async(req,res)=>{res.setHeader('Content-Type','application/json');let data;try{
 const path=new URL(req.url,'http://localhost').pathname;
 if(path.endsWith('/features'))data={cardPaymentsEnabled:true,metaEventsEnabled:false};
 else if(path.endsWith('/products/in-stock'))data=products;
 else if(path.endsWith('/price-rules'))data=Object.fromEntries(products.map(p=>[p.id,rules]));
 else if(path.endsWith('/bundles'))data=bundles;
 else if(path.endsWith('/cart-quote')){let raw='';for await(const chunk of req)raw+=chunk;data=quote(JSON.parse(raw));}
 else if(path.endsWith('/testimonials'))data=[];
 else if(path.includes('/postal-codes/'))data={postalCode:path.split('/').at(-1),localities:[{stateCode:'VER',stateName:'Veracruz',city:'Orizaba',districts:['Colonia de prueba']}]};
 else if(path.endsWith('/shipping-quote')){res.statusCode=400;data={message:'PRUEBA LOCAL: destino sin cobertura simulado. No se consultó una paquetería real.'};}
 else {res.statusCode=403;data={error:'PRUEBA LOCAL: pedidos, pagos y servicios externos bloqueados'};}
 }catch(e){res.statusCode=400;data={message:e.message};}res.end(JSON.stringify(data));}).listen(4319,'127.0.0.1',()=>console.log('Fixtures locales en http://127.0.0.1:4319; no genera pedidos.'));
