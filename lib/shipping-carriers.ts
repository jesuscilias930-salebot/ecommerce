// Match carrier identity, never a delivery estimate such as "90 minutos".
export function isAllowedShippingRate(rate:{carrier?:unknown}):boolean {
 const carrier=typeof rate?.carrier==='string'?rate.carrier.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,''):'';
 return !/^90(min|minuto|minutos|minute|minutes)$/.test(carrier);
}
