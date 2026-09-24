export const MARKETING_CONSENT_KEY='merlyn-marketing-consent-v2';
export function checkoutAttribution(){
 if(typeof window==='undefined')return undefined;
 try{
  if(localStorage.getItem(MARKETING_CONSENT_KEY)!=='accepted')return undefined;
  if(!['tienda.merlyncilias.com','ecommerce-9w7o.onrender.com'].includes(window.location.hostname))return undefined;
  const cookie=(name:string)=>document.cookie.split(';').map(v=>v.trim()).find(v=>v.startsWith(name+'='))?.slice(name.length+1);
  const valid=(value:string|undefined)=>value&&value.length<=255&&/^fb\.\d+\.\d{10,13}\.[A-Za-z0-9_.-]+$/.test(value)?value:undefined;
  const fbp=valid(cookie('_fbp')),fbc=valid(cookie('_fbc'));
  return fbp||fbc?{consent:true,fbp,fbc}:undefined;
 }catch{return undefined;}
}
