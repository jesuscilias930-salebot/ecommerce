import {PaymentResult} from '@/components/payment-result';
export const metadata={title:'Estado del pago',robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{session_id?:string}>}){
 const id=(await searchParams).session_id;
 return <main id="contenido" className="section">{typeof id==='string'&&/^cs_(test|live)_[A-Za-z0-9]{10,240}$/.test(id)?<PaymentResult sessionId={id}/>:<p role="alert">No se recibió una sesión de pago válida.</p>}</main>;
}
