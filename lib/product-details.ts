// Only merchant-verified merchandising data. Keys are product IDs, never fuzzy name matches.
export type ProductDetails={sizeRange?:string;material?:string;height?:string;assortment?:string;photos?:{url:string;view:'surtido'|'par'|'tejido'|'costuras'|'escala'|'empaque'}[]};
export const verifiedProductDetails:Record<number,ProductDetails>={};
export const assortmentDescription='Surtido automático según existencias, sin cantidades garantizadas por género o edad. Si eliges cantidades, respetamos los géneros y pares seleccionados en cada caja; diseños y colores siguen sujetos a existencias.';
