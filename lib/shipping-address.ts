export type ShippingAddress = {recipient:string;phone:string;email:string;country:string;postalCode:string;state:string;city:string;district:string;street:string;exteriorNumber:string;interiorNumber:string;references:string};
export const emptyAddress:ShippingAddress={recipient:'',phone:'',email:'',country:'MX',postalCode:'',state:'',city:'',district:'',street:'',exteriorNumber:'',interiorNumber:'',references:''};
export const addressLimits:Record<keyof ShippingAddress,number>={recipient:120,phone:15,email:254,country:2,postalCode:5,state:100,city:100,district:120,street:180,exteriorNumber:30,interiorNumber:30,references:300};
export function validateAddress(value:unknown):ShippingAddress {
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Completa la dirección de envío.');
 const a={...emptyAddress};
 for(const k of Object.keys(a) as (keyof ShippingAddress)[]){const v=(value as Record<string,unknown>)[k];if(typeof v!=='string')throw Error('Revisa los campos de la dirección.');a[k]=v.trim();if(a[k].length>addressLimits[k]||/[\u0000-\u001f\u007f]/.test(a[k]))throw Error('Revisa los campos de la dirección.');if(!['interiorNumber','references'].includes(k)&&!a[k])throw Error('Completa los campos obligatorios de envío.');}
 if(a.country!=='MX'||!/^\d{5}$/.test(a.postalCode)||!/^\d{8,15}$/.test(a.phone)||a.phone.startsWith('0')||!/^\S+@[^\s@]+\.[^\s@]+$/.test(a.email))throw Error('Revisa el código postal, teléfono y correo.');
 return a;
}
