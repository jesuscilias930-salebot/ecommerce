import 'server-only';
import {cookies} from 'next/headers';
import {createHmac} from 'node:crypto';
// Dedicated internal secret; never send it (or raw client IPs) to a browser.
export async function storeRequestIdentity():Promise<Record<string,string>>{
 const secret=process.env.STOREFRONT_RATE_LIMIT_SECRET||'';
 const id=(await cookies()).get('merlyn-visitor')?.value;
 if(secret.length<32||!id||!/^[a-f0-9-]{36}$/.test(id))return {};
 const time=String(Math.floor(Date.now()/1000));
 return {'X-Store-Visitor':id,'X-Store-Visitor-Time':time,'X-Store-Visitor-Signature':createHmac('sha256',secret).update(time+'.'+id).digest('hex')};
}
