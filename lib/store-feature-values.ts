export type StoreFeatures = {cardPaymentsEnabled:boolean;metaEventsEnabled:boolean;whatsappButtonEnabled:boolean;whatsappNumber:string};
export function normalizeStoreFeatures(value: unknown): StoreFeatures {
 const data=value && typeof value==='object' ? value as Record<string,unknown> : {};
 const number=typeof data.whatsappNumber==='string'&&/^[1-9]\d{6,14}$/.test(data.whatsappNumber)?data.whatsappNumber:'';
 const enabled=data.whatsappButtonEnabled===true&&!!number;
 return {cardPaymentsEnabled:data.cardPaymentsEnabled===true,metaEventsEnabled:data.metaEventsEnabled===true,whatsappButtonEnabled:enabled,whatsappNumber:enabled?number:''};
}
export function storeWhatsappHref(features: StoreFeatures): string | null {
 const safe=normalizeStoreFeatures(features);
 return safe.whatsappButtonEnabled ? `https://wa.me/${safe.whatsappNumber}?text=${encodeURIComponent('Hola, quiero comprar en la tienda Merlyn. ¿Me ayudas con mi pedido?')}` : null;
}
