import Link from 'next/link';
import './purchase-steps.css';
export function PurchaseSteps({step}:{step:1|2}){
 return <nav className="purchase-steps" aria-label="Pasos de compra"><ol>
  <li aria-current={step===1?'step':undefined} className={step===1?'current':'complete'}><span>{step===1?'1':'✓'}</span>{step===2?<Link href="/carrito">Tu carrito</Link>:<b>Tu carrito</b>}</li>
  <li aria-current={step===2?'step':undefined} className={step===2?'current':''}><span>2</span><b>Dirección y envío</b></li>
  <li><span>3</span><b>Pago seguro</b></li>
 </ol></nav>;
}
